import { z } from "zod";

export const updateProfileSchema = z.object({
  status: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  timezone: z.string().optional(),
  setupKeyboard: z.string().max(200).optional(),
  setupMouse: z.string().max(200).optional(),
  setupPc: z.string().max(200).optional(),
  setupComponents: z.string().max(2000).optional(),
  socialLinks: z
    .object({
      twitch: z.string().optional(),
      youtube: z.string().optional(),
      kick: z.string().optional(),
      spotify: z.string().optional(),
      soundcloud: z.string().optional(),
      discord: z.string().optional(),
      telegram: z.string().optional(),
    })
    .optional(),
  privacySettings: z
    .object({
      guestbook: z.enum(["all", "friends", "none"]),
      showLogin: z.boolean(),
      showSetup: z.boolean(),
      showListening: z.boolean(),
    })
    .optional(),
});

export const guestbookSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const nowPlayingSchema = z.object({
  trackTitle: z.string().min(1).max(200),
  artist: z.string().max(200).optional(),
  source: z.string().optional(),
  embedUrl: z.string().url().optional().or(z.literal("")),
  share: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
