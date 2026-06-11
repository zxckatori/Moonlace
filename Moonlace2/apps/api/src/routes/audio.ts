import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import { nowPlayingSchema } from "@moonlace/shared";
import { createFeedEvent } from "../services/feed.service";

export async function audioRoutes(app: FastifyInstance) {
  app.put("/v1/audio/now-playing", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const parsed = nowPlayingSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest();

    await prisma.listeningEntry.updateMany({
      where: { userId, isCurrent: true },
      data: { isCurrent: false },
    });

    const entry = await prisma.listeningEntry.create({
      data: {
        userId,
        trackTitle: parsed.data.trackTitle,
        artist: parsed.data.artist,
        source: parsed.data.source || "manual",
        embedUrl: parsed.data.embedUrl || null,
        isCurrent: true,
        shared: parsed.data.share || false,
      },
    });

    if (parsed.data.share) {
      await createFeedEvent(
        "LISTENING",
        userId,
        {
          trackTitle: entry.trackTitle,
          artist: entry.artist,
          embedUrl: entry.embedUrl,
        },
        app.io
      );
    }

    return entry;
  });

  app.get("/v1/audio/:nickname", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({ where: { nickname } });
    if (!user) throw app.httpErrors.notFound();

    const [current, history, favorites, uploads] = await Promise.all([
      prisma.listeningEntry.findFirst({
        where: { userId: user.id, isCurrent: true },
      }),
      prisma.listeningEntry.findMany({
        where: { userId: user.id, isCurrent: false },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.listeningEntry.findMany({
        where: { userId: user.id, isFavorite: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.galleryItem.findMany({
        where: { userId: user.id, type: "AUDIO" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { current, history, favorites, uploads };
  });

  app.post("/v1/audio/entries/:id/favorite", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { id } = req.params as { id: string };
    const entry = await prisma.listeningEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) throw app.httpErrors.forbidden();

    const updated = await prisma.listeningEntry.update({
      where: { id },
      data: { isFavorite: !entry.isFavorite },
    });
    return { isFavorite: updated.isFavorite };
  });

  app.post("/v1/audio/share", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const entry = await prisma.listeningEntry.findFirst({
      where: { userId, isCurrent: true },
    });
    if (!entry) throw app.httpErrors.notFound("No current track");

    await prisma.listeningEntry.update({
      where: { id: entry.id },
      data: { shared: true },
    });

    await createFeedEvent(
      "LISTENING",
      userId,
      {
        trackTitle: entry.trackTitle,
        artist: entry.artist,
        embedUrl: entry.embedUrl,
      },
      app.io
    );

    return { ok: true };
  });

  app.get("/v1/audio/now-listening/all", async () => {
    const entries = await prisma.listeningEntry.findMany({
      where: { isCurrent: true },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return entries;
  });
}
