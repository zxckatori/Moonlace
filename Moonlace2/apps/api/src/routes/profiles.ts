import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import { updateProfileSchema, guestbookSchema } from "@moonlace/shared";
import { uploadFile } from "../services/storage.service";
import { createFeedEvent } from "../services/feed.service";

export async function profileRoutes(app: FastifyInstance) {
  app.patch("/v1/profiles/me", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(JSON.stringify(parsed.error.flatten()));

    const { status, ...profileData } = parsed.data;
    if (status !== undefined) {
      await prisma.user.update({ where: { id: userId }, data: { status } });
    }

    return prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData },
      include: { theme: true },
    });
  });

  app.post("/v1/profiles/me/avatar", { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string };
    const data = await req.file();
    if (!data) throw app.httpErrors.badRequest("No file");

    const buffer = await data.toBuffer();
    const url = await uploadFile(buffer, data.mimetype, "avatar");
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
    return { avatarUrl: url };
  });

  app.post("/v1/profiles/me/background", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const data = await req.file();
    if (!data) throw app.httpErrors.badRequest("No file");

    const buffer = await data.toBuffer();
    const url = await uploadFile(buffer, data.mimetype, "background");
    await prisma.profile.upsert({
      where: { userId },
      update: { backgroundUrl: url },
      create: { userId, backgroundUrl: url },
    });
    return { backgroundUrl: url };
  });

  app.get("/v1/profiles/:nickname/guestbook", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({ where: { nickname } });
    if (!user) throw app.httpErrors.notFound();

    return prisma.guestbookEntry.findMany({
      where: { profileUserId: user.id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });

  app.post("/v1/profiles/:nickname/guestbook", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { nickname } = req.params as { nickname: string };
    const parsed = guestbookSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest();

    const profileUser = await prisma.user.findUnique({
      where: { nickname },
      include: { profile: true },
    });
    if (!profileUser) throw app.httpErrors.notFound();

    const privacy = (profileUser.profile?.privacySettings || { guestbook: "all" }) as {
      guestbook: string;
    };
    if (privacy.guestbook === "none") {
      throw app.httpErrors.forbidden("Guestbook disabled");
    }

    return prisma.guestbookEntry.create({
      data: {
        profileUserId: profileUser.id,
        authorId: userId,
        content: parsed.data.content,
      },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    });
  });

  app.get("/v1/profiles/:nickname/gallery", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({ where: { nickname } });
    if (!user) throw app.httpErrors.notFound();

    return prisma.galleryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/v1/profiles/me/gallery", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const data = await req.file();
    if (!data) throw app.httpErrors.badRequest("No file");

    const buffer = await data.toBuffer();
    const isGif = data.mimetype === "image/gif";
    const isVideo = data.mimetype.startsWith("video/");
    const isAudio = data.mimetype.startsWith("audio/");
    const category = isGif ? "gif" : isVideo ? "video" : isAudio ? "audio" : "image";
    const url = await uploadFile(buffer, data.mimetype, category as "gif");

    const item = await prisma.galleryItem.create({
      data: {
        userId,
        url,
        type: isGif ? "GIF" : isVideo ? "VIDEO" : isAudio ? "AUDIO" : "IMAGE",
      },
    });

    const io = app.io;
    await createFeedEvent("GALLERY", userId, { url, type: item.type }, io);
    return item;
  });

  app.post("/v1/profiles/me/wall", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { content } = req.body as { content: string };
    if (!content?.trim()) throw app.httpErrors.badRequest();

    const post = await prisma.post.create({
      data: { content, authorId: userId, wallUserId: userId },
      include: { author: { select: { nickname: true, avatarUrl: true } } },
    });

    await createFeedEvent("WALL_POST", userId, { postId: post.id, preview: content.slice(0, 120) }, app.io);
    return post;
  });

  app.get("/v1/profiles/:nickname/wall", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({ where: { nickname } });
    if (!user) throw app.httpErrors.notFound();

    return prisma.post.findMany({
      where: { wallUserId: user.id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        reactions: { include: { user: { select: { id: true, nickname: true } } } },
        media: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  });

  app.delete("/v1/profiles/me/wall/:postId", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { postId } = req.params as { postId: string };

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.wallUserId !== userId || post.authorId !== userId) {
      throw app.httpErrors.forbidden("Можно удалять только свои посты на своей стене");
    }

    await prisma.postReaction.deleteMany({ where: { postId } });
    await prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  });

  app.post("/v1/profiles/wall/:postId/react", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { postId } = req.params as { postId: string };

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post?.wallUserId) throw app.httpErrors.notFound();

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
      return { reacted: false, type: "class" };
    }

    await prisma.postReaction.create({ data: { postId, userId, type: "class" } });
    return { reacted: true, type: "class" };
  });
}
