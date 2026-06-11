import * as esbuild from "esbuild";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

mkdirSync(join(root, "dist"), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: join(root, "dist/index.js"),
  format: "cjs",
  sourcemap: true,
  external: [
    "@moonlace/db",
    "@moonlace/shared",
    "@prisma/client",
    ".prisma/client",
    "argon2",
    "fastify",
    "@fastify/cors",
    "@fastify/cookie",
    "@fastify/jwt",
    "@fastify/multipart",
    "@fastify/rate-limit",
    "@fastify/sensible",
    "fastify-plugin",
    "jsonwebtoken",
    "ioredis",
    "socket.io",
    "@aws-sdk/client-s3",
  ],
});

console.log("API built ? dist/index.js");
