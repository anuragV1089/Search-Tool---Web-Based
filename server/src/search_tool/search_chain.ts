import { RunnableBranch, RunnableSequence } from "@langchain/core/runnables";
import { webBasedPath } from "./web_pipeline";
import { directBasedPath } from "./direct_pipeline";
import { routerStep } from "./route_strategy";
import { finalValidateandPolish } from "./finalValidate";
import { SearchInput } from "../utils/schema";

const branch = RunnableBranch.from<{ q: string; mode: "web" | "direct" }, any>([
  //if else
  [(input) => input.mode === "web", webBasedPath],
  directBasedPath,
]);

export const searchChain = RunnableSequence.from([
  routerStep,
  branch,
  finalValidateandPolish,
]);

export async function runSearch(input: SearchInput) {
  return await searchChain.invoke(input);
}
