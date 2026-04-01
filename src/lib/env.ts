import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, z.string().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, z.string().url().optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: optionalString,
  OPENAI_API_KEY: optionalString,
  N8N_BASE_URL: optionalUrl,
  N8N_API_KEY: optionalString,
  APP_URL: optionalUrl,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  META_CLIENT_ID: optionalString,
  META_CLIENT_SECRET: optionalString,
  OAUTH_STATE_SECRET: optionalString
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_API_KEY: process.env.N8N_API_KEY,
  APP_URL: process.env.APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  META_CLIENT_ID: process.env.META_CLIENT_ID,
  META_CLIENT_SECRET: process.env.META_CLIENT_SECRET,
  OAUTH_STATE_SECRET: process.env.OAUTH_STATE_SECRET
});
