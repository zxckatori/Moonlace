import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { Server } from "socket.io";
import { config } from "./config";
import authPlugin from "./plugins/auth";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { profileRoutes } from "./routes/profiles";
import { forumRoutes } from "./routes/forum";
import { feedRoutes } from "./routes/feed";
import { messageRoutes } from "./routes/messages";
import { mediaRoutes } from "./routes/media";
import { streamRoutes } from "./routes/streams";
import { audioRoutes } from "./routes/audio";
import { themeRoutes } from "./routes/themes";
import { startTwitchPollJob } from "./jobs/twitch-poll.job";
import { ensureBucket } from "./services/storage.service";

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
  }
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(sensible);

  await app.register(cors, {
    origin: config.webUrl,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(jwt, { secret: config.jwtSecret });
  await app.register(authPlugin);
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.setErrorHandler((error: unknown, _req, reply) => {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    reply.status(status).send({
      error: err.message || "Internal Server Error",
    });
  });

  await authRoutes(app);
  await userRoutes(app);
  await profileRoutes(app);
  await forumRoutes(app);
  await feedRoutes(app);
  await messageRoutes(app);
  await mediaRoutes(app);
  await streamRoutes(app);
  await audioRoutes(app);
  await themeRoutes(app);

  app.get("/v1/health", async () => ({ ok: true, service: "moonlace-api" }));

  try {
    await ensureBucket();
  } catch (e) {
    app.log.warn("S3 bucket init skipped (MinIO may be offline)");
  }

  await app.ready();

  const io = new Server(app.server, {
    cors: { origin: config.webUrl, credentials: true },
  });
  app.decorate("io", io);

  io.on("connection", (socket) => {
    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
    });
  });

  startTwitchPollJob(io);

  await app.listen({ port: config.port, host: "0.0.0.0" });
  console.log(`Moonlace API running on http://localhost:${config.port}`);
}

main().catch(console.error);
