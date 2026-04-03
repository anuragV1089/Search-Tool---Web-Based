//cheap mode
//here we don't call tavily we just call the model directly

import { RunnableLambda } from "@langchain/core/runnables";
import { Candidate } from "./types";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const directBasedPath = RunnableLambda.from(
  async (input: { q: string; mode: "web" | "direct" }): Promise<Candidate> => {
    const model = getChatModel({ temperature: 0.2 });

    const res = await model.invoke([
      new SystemMessage(
        [
          "You answer briefly and clearly for beginners",
          "If unsure, say so",
        ].join("\n"),
      ),
      new HumanMessage(input.q),
    ]);

    const directAns = (
      typeof res.content === "string" ? res.content : String(res.content)
    ).trim();

    return {
      answer: directAns,
      sources: [],
      mode: "direct",
    };
  },
);
