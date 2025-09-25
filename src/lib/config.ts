import { z } from 'zod';

export function getAppConfig() {
  return z
    .object({
      VITE_PARAGON_PROJECT_ID: z.string(),
      VITE_PARAGON_JWT_TOKEN: z.string(),
      VITE_GOOGLE_API_KEY: z.string().optional(),
      VITE_GOOGLE_APP_ID: z.string().optional(),
    })
    .safeParse(import.meta.env);
}
