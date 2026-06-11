import Redis from "ioredis";
import { config } from "../config";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      tls: config.redisUrl.startsWith("rediss://") ? {} : undefined,
    });
  }
  return redis;
}
