import { env } from "./env";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

//low temperature -> crisp summary

type ModelOpts = {
  temperature?: number;
  maxTokens?: number;
};

export function getChatModel(opts: ModelOpts = {}): BaseChatModel {
  const temp = opts.temperature ?? 0.2;

  switch (env.MODEL_PROVIDER) {
    case "gemini":
      return new ChatGoogle({
        model: env.GEMINI_MODEL,
        temperature: temp,
      });
    case "groq":
      return new ChatGroq({
        model: env.GROQ_MODEL,
        temperature: temp,
      });
    case "openai":
    default:
      return new ChatOpenAI({
        model: env.OPENAI_MODEL,
        temperature: temp,
      });
  }
}
