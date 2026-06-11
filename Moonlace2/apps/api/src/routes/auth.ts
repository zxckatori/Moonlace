import { FastifyInstance } from "fastify";
import * as argon2 from "argon2";
import { prisma } from "@moonlace/db";
import { registerSchema, loginSchema } from "@moonlace/shared";
import { getRedis } from "../lib/redis";
import { config } from "../config";

export async function authRoutes(app: FastifyInstance) {
  app.post("/v1/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { login, nickname, email, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ login }, { nickname }, { email }] },
    });
    if (existing) {
      return reply.status(409).send({ error: "USER_EXISTS" });
    }

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        login,
        nickname,
        email,
        passwordHash,
        profile: { create: {} },
      },
      select: { id: true, login: true, nickname: true, email: true },
    });

    const warning = login === nickname ? "LOGIN_NICKNAME_MATCH" : undefined;
    const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign(
      { userId: user.id, type: "refresh" },
      { secret: config.jwtRefreshSecret, expiresIn: "7d" }
    );

    const redis = getRedis();
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 3600, refreshToken);

    reply
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 3600,
      })
      .send({ user, accessToken, warning });
  });

  app.post("/v1/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { login, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { login } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      return reply.status(401).send({ error: "INVALID_CREDENTIALS" });
    }

    const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign(
      { userId: user.id, type: "refresh" },
      { secret: config.jwtRefreshSecret, expiresIn: "7d" }
    );

    const redis = getRedis();
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 3600, refreshToken);

    reply
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 3600,
      })
      .send({
        user: {
          id: user.id,
          login: user.login,
          nickname: user.nickname,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
      });
  });

  app.post("/v1/auth/refresh", async (req, reply) => {
    const refreshToken = (req.cookies as { refreshToken?: string })?.refreshToken;
    if (!refreshToken) return reply.status(401).send({ error: "NO_REFRESH_TOKEN" });

    try {
      const payload = app.jwt.verify<{ userId: string; type: string }>(refreshToken, {
        secret: config.jwtRefreshSecret,
      });
      const redis = getRedis();
      const stored = await redis.get(`refresh:${payload.userId}`);
      if (stored !== refreshToken) {
        return reply.status(401).send({ error: "INVALID_REFRESH_TOKEN" });
      }
      const accessToken = app.jwt.sign({ userId: payload.userId }, { expiresIn: "15m" });
      return { accessToken };
    } catch {
      return reply.status(401).send({ error: "INVALID_REFRESH_TOKEN" });
    }
  });

  app.post("/v1/auth/logout", async (req, reply) => {
    try {
      await req.jwtVerify();
      const { userId } = req.user as { userId: string };
      const redis = getRedis();
      await redis.del(`refresh:${userId}`);
    } catch {
      /* ignore */
    }
    reply.clearCookie("refreshToken").send({ ok: true });
  });
}
