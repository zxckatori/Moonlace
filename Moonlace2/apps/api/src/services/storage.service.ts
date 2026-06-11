import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: true,
});

const MIME_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const SIZE_LIMITS: Record<string, number> = {
  avatar: 2 * 1024 * 1024,
  image: 10 * 1024 * 1024,
  gif: 10 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  background: 5 * 1024 * 1024,
};

let bucketReady = false;

export async function ensureBucket() {
  if (bucketReady) return;
  if (!process.env.S3_ENDPOINT) {
    bucketReady = true;
    return;
  }
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
  }
  bucketReady = true;
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  category: keyof typeof SIZE_LIMITS,
  filename?: string
): Promise<string> {
  const limit = SIZE_LIMITS[category] || SIZE_LIMITS.image;
  if (buffer.length > limit) {
    throw new Error(`FILE_TOO_LARGE: max ${limit / 1024 / 1024}MB`);
  }

  if (!process.env.S3_ENDPOINT) {
    if (category === "avatar" || category === "background") {
      const base64 = buffer.toString("base64");
      return `data:${mimeType};base64,${base64}`;
    }
    throw new Error("MEDIA_STORAGE_NOT_CONFIGURED");
  }

  await ensureBucket();
  const ext = MIME_MAP[mimeType] || filename?.split(".").pop() || "bin";
  const key = `${category}/${randomUUID()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return `${config.s3.publicUrl}/${key}`;
}
