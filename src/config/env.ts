import "dotenv/config";
import { z } from "zod";

const boolFromEnv = (v: string | undefined) => {
  if (v === undefined) return undefined;
  return v.toLowerCase() === "true" || v === "1";
};

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  // Auth
  JWT_SECRET: z.string().default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  DATABASE_URL: z.string().optional(),

  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("vogueThreads"),
  DB_USER: z.string().default("devEccomerce"),
  DB_PASSWORD: z.string().default("devEccomerce$"),
  DB_SSL: z.preprocess((v) => boolFromEnv(v as string | undefined), z.boolean().default(false))
});

export const env = envSchema.parse(process.env);
