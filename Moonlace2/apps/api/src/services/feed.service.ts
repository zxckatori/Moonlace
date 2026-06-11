import { prisma, FeedEventType } from "@moonlace/db";
import type { Server } from "socket.io";

export async function createFeedEvent(
  type: FeedEventType,
  userId: string,
  payload: Record<string, unknown>,
  io?: Server
) {
  const event = await prisma.feedEvent.create({
    data: { type, userId, payload },
    include: {
      user: { select: { id: true, nickname: true, avatarUrl: true } },
    },
  });
  if (io) {
    io.emit("feed:update", event);
  }
  return event;
}
