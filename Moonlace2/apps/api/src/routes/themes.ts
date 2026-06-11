import { FastifyInstance } from "fastify";
import { prisma } from "@moonlace/db";
import { createThemeSchema } from "@moonlace/shared";
import { uploadFile } from "../services/storage.service";

export async function themeRoutes(app: FastifyInstance) {
  app.get("/v1/themes", async (req) => {
    const { public: isPublic } = req.query as { public?: string };
    return prisma.userTheme.findMany({
      where: isPublic === "true" ? { isPublic: true } : undefined,
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { usageCount: "desc" },
      take: 50,
    });
  });

  app.get("/v1/themes/mine", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    return prisma.userTheme.findMany({
      where: { authorId: userId },
      include: { author: { select: { id: true, nickname: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/v1/themes", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const parsed = createThemeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw app.httpErrors.badRequest(JSON.stringify({
        error: parsed.error.flatten(),
        message: "Проверьте поля формы",
      }));
    }

    return prisma.userTheme.create({
      data: { authorId: userId, ...parsed.data },
    });
  });

  app.post("/v1/themes/:id/apply", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { id } = req.params as { id: string };

    const theme = await prisma.userTheme.findUnique({ where: { id } });
    if (!theme) throw app.httpErrors.notFound();
    if (!theme.isPublic && theme.authorId !== userId) {
      throw app.httpErrors.forbidden();
    }

    await prisma.profile.upsert({
      where: { userId },
      update: { activeThemeId: id },
      create: { userId, activeThemeId: id },
    });

    await prisma.userTheme.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return theme;
  });

  app.patch("/v1/themes/:id", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { id } = req.params as { id: string };
    const { isPublic, name } = req.body as { isPublic?: boolean; name?: string };

    const theme = await prisma.userTheme.findUnique({ where: { id } });
    if (!theme || theme.authorId !== userId) throw app.httpErrors.forbidden();

    return prisma.userTheme.update({
      where: { id },
      data: {
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(name ? { name } : {}),
      },
    });
  });

  app.post("/v1/themes/:id/rate", { preHandler: [app.authenticate] }, async (req) => {
    const { id } = req.params as { id: string };
    const { rating } = req.body as { rating: number };
    if (rating < 1 || rating > 5) throw app.httpErrors.badRequest();

    const theme = await prisma.userTheme.findUnique({ where: { id } });
    if (!theme) throw app.httpErrors.notFound();

    const newRating = (theme.rating + rating) / 2;
    return prisma.userTheme.update({
      where: { id },
      data: { rating: newRating },
    });
  });

  app.post("/v1/themes/:id/background", { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as { userId: string };
    const { id } = req.params as { id: string };

    const theme = await prisma.userTheme.findUnique({ where: { id } });
    if (!theme || theme.authorId !== userId) throw app.httpErrors.forbidden();

    const data = await req.file();
    if (!data) throw app.httpErrors.badRequest("No file");

    const buffer = await data.toBuffer();
    const url = await uploadFile(buffer, data.mimetype, "background");

    return prisma.userTheme.update({
      where: { id },
      data: { backgroundUrl: url },
    });
  });
}
