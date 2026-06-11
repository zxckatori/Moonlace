import { z } from "zod";

export const registerSchema = z.object({
  login: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Логин: только латиница, цифры, _"),
  nickname: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_\-\.]+$/, "Никнейм: латиница, цифры, _ - ."),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
