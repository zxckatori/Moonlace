import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import { uploadFile } from "../services/storage.service";

export async function messageRoutes(app: FastifyInstance) {
  app.get("/v1/messages/conversations", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, nickname: true, avatarUrl: true } },
        receiver: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const conversations = new Map<
      string,
      {
        partner: { id: string; nickname: string; avatarUrl: string | null };
        lastMessage: (typeof messages)[0];
        unread: number;
      }
    >();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversations.has(partnerId)) {
        const unread = await prisma.message.count({
          where: { senderId: partnerId, receiverId: userId, read: false },
        });
        conversations.set(partnerId, { partner, lastMessage: msg, unread });
      }
    }

    return Array.from(conversations.values());
  });

  app.get("/v1/messages/unread-count", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const count = await prisma.message.count({
      where: { receiverId: userId, read: false },
    });
    return { count };
  });

  app.get("/v1/messages/:partnerId", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { partnerId } = req.params as { partnerId: string };

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      include: { media: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    await prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: userId, read: false },
      data: { read: true },
    });

    return messages;
  });

  app.post("/v1/messages/:partnerId", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { partnerId } = req.params as { partnerId: string };
    const { content } = req.body as { content: string };
    if (!content?.trim()) throw app.httpErrors.badRequest();

    const partner = await prisma.user.findUnique({ where: { id: partnerId } });
    if (!partner) throw app.httpErrors.notFound();

    const message = await prisma.message.create({
      data: { senderId: userId, receiverId: partnerId, content },
      include: {
        sender: { select: { id: true, nickname: true, avatarUrl: true } },
        receiver: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    });

    app.io?.to(`user:${partnerId}`).emit("message:new", message);
    app.io?.to(`user:${userId}`).emit("message:new", message);

    return message;
  });
}
