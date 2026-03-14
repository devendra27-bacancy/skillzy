import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  STORE_PROVIDER: z.enum(["file", "supabase"]).default("file"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
});

export type ApiEnv = z.infer<typeof envSchema>;

export function getApiEnv(): ApiEnv {
  const parsed = envSchema.parse(process.env);
  if (parsed.STORE_PROVIDER === "supabase") {
    if (!parsed.SUPABASE_URL || !parsed.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "STORE_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
  }
  return parsed;
}
