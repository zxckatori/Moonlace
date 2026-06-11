import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || process.env.API_PORT || "4000", 10),
  webUrl: process.env.WEB_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "moonlace",
    secretKey: process.env.S3_SECRET_KEY || "moonlace123",
    bucket: process.env.S3_BUCKET || "moonlace-media",
    publicUrl: process.env.S3_PUBLIC_URL || "http://localhost:9000/moonlace-media",
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || "",
    clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
  },
};
