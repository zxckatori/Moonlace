import { FastifyInstance } from "fastify";
import { prisma, FeedEventType } from "@moonlace/db";

const FILTER_MAP: Record<string, FeedEventType[]> = {
  all: [],
  forum: ["FORUM_POST", "NEW_TOPIC"],
  music: ["LISTENING"],
  streams: ["STREAM_LIVE"],
  gallery: ["GALLERY"],
  wall: ["WALL_POST"],
};

export async function feedRoutes(app: FastifyInstance) {
  app.get("/v1/feed", async (req) => {
    const { filter = "all", category, cursor } = req.query as {
      filter?: string;
      category?: string;
      cursor?: string;
    };

    const types = FILTER_MAP[filter] || [];
    const where: Record<string, unknown> = {};
    if (types.length) where.type = { in: types };
    if (category) {
      where.payload = { path: ["categorySlug"], equals: category };
    }

    const events = await prisma.feedEvent.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    return {
      events,
      nextCursor: events.length === 30 ? events[events.length - 1]?.id : null,
    };
  });
}
