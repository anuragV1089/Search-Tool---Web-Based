//we decide actual things to return to the frontend

import { RunnableLambda } from "@langchain/core/runnables";
import { Candidate } from "./types";
import { SearchAnswerSchema } from "../utils/schema";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const finalValidateandPolish = RunnableLambda.from(
  async (candidate: Candidate) => {
    const finalDraft = {
      answer: candidate.answer,
      sources: candidate.sources ?? [],
    };

    const parsed1 = SearchAnswerSchema.safeParse(finalDraft);

    if (parsed1.success) {
      return parsed1.data;
    }

    //one shot repair in case the schema is not correct
    const repaired = await repairSearchAnswer(finalDraft);

    const parsed2 = SearchAnswerSchema.safeParse(repaired);

    if (parsed2.success) {
      return parsed2.data;
    }
  },
);

async function repairSearchAnswer(obj: any): Promise<{
  answer: string;
  sources: string[];
}> {
  const model = getChatModel({ temperature: 0.2 });

  const res = await model.invoke([
    new SystemMessage(
      [
        "You fix JSON objects to match a given schema.",
        "You respond only with valid JSON object.",
        "Schema: {answer: string, sources: string[]} (urls as strings)",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        "Make this exactly to the schema",
        "Ensure sources is an array of url strings",
        "Input JSON:",
        JSON.stringify(obj),
      ].join("\n\n"),
    ),
  ]);

  const text = (
    typeof res.content === "string" ? res.content : String(res.content)
  ).trim();

  const json = extractJson(text);

  return {
    answer: String(json.answer ?? "").trim(),
    sources: Array.isArray(json?.sources) ? json?.sources?.map(String) : [],
  };
  //shorthand for converting each element into string => json.source.map((x) => String(x))
}

function extractJson(input: string) {
  const start = input.indexOf("{");
  const end = input.indexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};

  try {
    return JSON.parse(input.slice(start, end + 1));
  } catch {
    return {};
  }
}
