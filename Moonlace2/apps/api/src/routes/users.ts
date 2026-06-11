import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import type { PrivacySettings } from "@moonlace/shared";

export async function userRoutes(app: FastifyInstance) {
  app.get("/v1/users/me", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { theme: true } } },
    });
    if (!user) throw app.httpErrors.notFound();
    const { passwordHash: _, ...safe } = user;
    return safe;
  });

  app.patch("/v1/users/me", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { status } = req.body as { status?: string };
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, nickname: true, status: true, avatarUrl: true },
    });
  });

  app.get("/v1/users/:nickname", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({
      where: { nickname },
      include: {
        profile: { include: { theme: true } },
        streamStatus: true,
        listeningHistory: {
          where: { isCurrent: true },
          take: 1,
        },
        _count: {
          select: { posts: true, galleryItems: true, topics: true },
        },
      },
    });
    if (!user) throw app.httpErrors.notFound();

    const privacy = (user.profile?.privacySettings || {}) as unknown as PrivacySettings;
    const { passwordHash: _, login, email, ...safe } = user;

    return {
      ...safe,
      login: privacy.showLogin ? login : undefined,
      email: undefined,
    };
  });
}
