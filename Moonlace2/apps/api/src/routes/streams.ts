import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import type { SocialLinks } from "@moonlace/shared";

export async function streamRoutes(app: FastifyInstance) {
  app.get("/v1/streams/live", async () => {
    const live = await prisma.streamStatus.findMany({
      where: { isLive: true },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    });
    return live;
  });

  app.get("/v1/streams/:nickname", async (req) => {
    const { nickname } = req.params as { nickname: string };
    const user = await prisma.user.findUnique({
      where: { nickname },
      include: { streamStatus: true, profile: true },
    });
    if (!user) throw app.httpErrors.notFound();

    const social = (user.profile?.socialLinks || {}) as SocialLinks;
    return {
      stream: user.streamStatus,
      twitch: social.twitch,
      youtube: social.youtube,
      kick: social.kick,
    };
  });

  app.put("/v1/profiles/me/stream-links", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { twitch, youtube, kick } = req.body as {
      twitch?: string;
      youtube?: string;
      kick?: string;
    };

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const social = (profile?.socialLinks || {}) as SocialLinks;

    const updated = await prisma.profile.upsert({
      where: { userId },
      update: {
        socialLinks: { ...social, twitch, youtube, kick },
      },
      create: {
        userId,
        socialLinks: { twitch, youtube, kick },
      },
    });

    if (twitch) {
      await prisma.streamStatus.upsert({
        where: { userId },
        update: { platformId: twitch, platform: "twitch" },
        create: { userId, platformId: twitch, platform: "twitch", isLive: false },
      });
    }

    return updated;
  });
}
