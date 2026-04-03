import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  ALLOWED_ORIGIN: z.url().default("http://localhost:3000"),
  MODEL_PROVIDER: z.enum(["gemini", "openai", "groq"]).default("gemini"),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite-preview"),
  GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
  SEARCH_PROVIDER: z.string().default("tavily"),
  TAVILY_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
