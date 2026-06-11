import { z } from "zod";

export const createThemeSchema = z.object({
  name: z.string().min(2).max(64),
  isPublic: z.boolean().default(false),
  backgroundColor: z.string().optional(),
  accentColor: z.string().default("#b026ff"),
  fontFamily: z.enum(["Space Mono", "VT323", "Orbitron", "Cinzel"]).default("Space Mono"),
  scanlineIntensity: z.number().min(0).max(0.2).default(0.04),
});

export type CreateThemeInput = z.infer<typeof createThemeSchema>;
