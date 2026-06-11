import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import { createTopicSchema, createPostSchema } from "@moonlace/shared";
import { createFeedEvent } from "../services/feed.service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "topic";
}

export async function forumRoutes(app: FastifyInstance) {
  app.get("/v1/forum/categories", async () => {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { topics: true } } },
    });
  });

  app.get("/v1/forum/categories/:slug/topics", async (req) => {
    const { slug } = req.params as { slug: string };
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) throw app.httpErrors.notFound();

    return prisma.topic.findMany({
      where: { categoryId: category.id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  });

  app.get("/v1/forum/topics/:categorySlug/:topicSlug", async (req) => {
    const { categorySlug, topicSlug } = req.params as {
      categorySlug: string;
      topicSlug: string;
    };
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw app.httpErrors.notFound();

    const topic = await prisma.topic.findUnique({
      where: { categoryId_slug: { categoryId: category.id, slug: topicSlug } },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        category: true,
      },
    });
    if (!topic) throw app.httpErrors.notFound();
    return topic;
  });

  app.get("/v1/forum/topics/:categorySlug/:topicSlug/posts", async (req) => {
    const { categorySlug, topicSlug } = req.params as {
      categorySlug: string;
      topicSlug: string;
    };
    const { cursor } = req.query as { cursor?: string };

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw app.httpErrors.notFound();

    const topic = await prisma.topic.findUnique({
      where: { categoryId_slug: { categoryId: category.id, slug: topicSlug } },
    });
    if (!topic) throw app.httpErrors.notFound();

    const posts = await prisma.post.findMany({
      where: { topicId: topic.id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        media: true,
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    return { posts, nextCursor: posts.length === 20 ? posts[posts.length - 1]?.id : null };
  });

  app.post("/v1/forum/topics", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const parsed = createTopicSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(JSON.stringify(parsed.error.flatten()));

    const { title, categorySlug, content, tags } = parsed.data;
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw app.httpErrors.notFound("Category not found");

    let slug = slugify(title);
    const existing = await prisma.topic.findUnique({
      where: { categoryId_slug: { categoryId: category.id, slug } },
    });
    if (existing) slug = `${slug}-${Date.now()}`;

    const topic = await prisma.topic.create({
      data: {
        title,
        slug,
        categoryId: category.id,
        authorId: userId,
        tags: tags || [],
        posts: { create: { content, authorId: userId } },
      },
      include: {
        category: true,
        author: { select: { nickname: true, avatarUrl: true } },
      },
    });

    await createFeedEvent(
      "NEW_TOPIC",
      userId,
      {
        topicSlug: topic.slug,
        categorySlug: category.slug,
        categoryName: category.name,
        title: topic.title,
      },
      app.io
    );

    return topic;
  });

  app.post("/v1/forum/posts", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest();

    const { content, topicSlug, categorySlug } = parsed.data;
    if (!topicSlug || !categorySlug) throw app.httpErrors.badRequest("topicSlug and categorySlug required");

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw app.httpErrors.notFound();

    const topic = await prisma.topic.findUnique({
      where: { categoryId_slug: { categoryId: category.id, slug: topicSlug } },
    });
    if (!topic) throw app.httpErrors.notFound();

    const post = await prisma.post.create({
      data: { content, authorId: userId, topicId: topic.id },
      include: { author: { select: { nickname: true, avatarUrl: true } } },
    });

    await prisma.topic.update({ where: { id: topic.id }, data: { updatedAt: new Date() } });

    await createFeedEvent(
      "FORUM_POST",
      userId,
      {
        topicSlug,
        categorySlug,
        categoryName: category.name,
        topicTitle: topic.title,
        preview: content.slice(0, 120),
      },
      app.io
    );

    return post;
  });

  app.post("/v1/forum/posts/:id/react", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { id } = req.params as { id: string };

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId: id, userId } },
    });
    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await prisma.postReaction.create({ data: { postId: id, userId } });
    return { liked: true };
  });

  app.post("/v1/forum/topics/:categorySlug/:topicSlug/subscribe", {
    preHandler: [app.authenticate],
  }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { categorySlug, topicSlug } = req.params as { categorySlug: string; topicSlug: string };

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw app.httpErrors.notFound();

    const topic = await prisma.topic.findUnique({
      where: { categoryId_slug: { categoryId: category.id, slug: topicSlug } },
    });
    if (!topic) throw app.httpErrors.notFound();

    await prisma.topicSubscription.upsert({
      where: { userId_topicId: { userId, topicId: topic.id } },
      update: {},
      create: { userId, topicId: topic.id },
    });
    return { subscribed: true };
  });
}
