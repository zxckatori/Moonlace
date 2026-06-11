import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    await request.jwtVerify();
  });
}

export default fp(authPlugin);
