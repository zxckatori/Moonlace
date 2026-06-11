import { z } from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(3).max(200),
  categorySlug: z.string(),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string()).max(10).optional(),
});

export const createPostSchema = z.object({
  content: z.string().min(1).max(50000),
  topicSlug: z.string().optional(),
  categorySlug: z.string().optional(),
  wallUserId: z.string().optional(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
