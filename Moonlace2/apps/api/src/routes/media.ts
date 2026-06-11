import { FastifyInstance } from "fastify";
import { uploadFile } from "../services/storage.service";

export async function mediaRoutes(app: FastifyInstance) {
  app.post("/v1/media/upload", { preHandler: [app.authenticate] }, async (req) => {
    const data = await req.file();
    if (!data) throw app.httpErrors.badRequest("No file");

    const fields = data.fields as Record<string, { value?: string }>;
    const type = (fields.type?.value || "image") as "avatar" | "image" | "gif" | "audio" | "video" | "background";

    const buffer = await data.toBuffer();
    const url = await uploadFile(buffer, data.mimetype, type);
    return { url, type, mimetype: data.mimetype };
  });
}
