//E.g top 10 engineering college in India?
//search the web -> using webSearch/tavily
//visit every result -> using openUrl/fetch
//summarize the result -> using summarize/llm
//return the candidate, answer, sources and mode

//user flow
//types in UI -> decide -> search the web -> visit every page -> summarize the pages -> return the candidate, answer, sources and mode

import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { webSearch } from "../utils/webSearch";
import { openUrl } from "../utils/openUrl";
import { summarize } from "../utils/summarize";
import { Candidate } from "./types";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const setTopResults = 5;

export const webSearchStep = RunnableLambda.from(
  async (input: { q: string; mode: "web" | "direct" }) => {
    const results = await webSearch(input.q);

    return {
      ...input,
      results,
    };
  },
);

export const openAndSummarizeStep = RunnableLambda.from(
  async (input: { q: string; mode: "web" | "direct"; results: any[] }) => {
    if (!Array.isArray(input.results) || input.results.length === 0)
      return {
        ...input,
        pageSummaries: [],
        fallback: "no-results" as const,
      };

    const extractTopResults = input.results.slice(0, setTopResults);

    const settledResults = await Promise.allSettled(
      extractTopResults.map(async (result: any) => {
        const opened = await openUrl(result.url);
        const summarizeContent = await summarize(opened.content);

        return {
          url: opened.url,
          content: summarizeContent.summary,
        };
      }),
    );

    const settledResultsPageSummaries = settledResults
      .filter((settledResult) => settledResult.status === "fulfilled")
      .map((s) => s.value);

    // if allSettled every case fails, can't visit a single url
    if (settledResultsPageSummaries.length === 0) {
      const fallbackSnippetSummaries = extractTopResults
        .map((result: any) => ({
          url: result.url,
          summary: String(result.snippet || result.title || "").trim(),
        }))
        .filter((x: any) => x.summary.length > 0);

      return {
        ...input,
        pageSummaries: fallbackSnippetSummaries,
        fallback: "snippets" as const,
      };
    }

    return {
      ...input,
      pageSummaries: settledResultsPageSummaries,
      fallback: "none" as const,
    };
  },
);

//compose step
//{q, pageSummaries:[{url, summary}], mode, fallback}
//but we need candidate, so for that we need another step
//candidate -> answer, sources, mode

export const composeStep = RunnableLambda.from(
  async (input: {
    q: string;
    pageSummaries: Array<{ url: string; summary: string }>;
    mode: "web" | "direct";
    fallback: "no-results" | "snippets" | "none";
  }): Promise<Candidate> => {
    const model = getChatModel({ temperature: 0.2 });

    if (!input.pageSummaries || input.pageSummaries.length === 0) {
      const directAnsFromModel = await model.invoke([
        new SystemMessage(
          [
            "You answer briefly and clearly for beginners",
            "If unsure, say so",
          ].join("\n"),
        ),
        new HumanMessage(input.q),
      ]);

      const directAns = (
        typeof directAnsFromModel === "string"
          ? directAnsFromModel
          : String(directAnsFromModel)
      ).trim();
      return {
        answer: directAns,
        sources: [],
        mode: "direct",
      };
    }

    const res = await model.invoke([
      new SystemMessage(
        [
          "You concisely answer question using provided page summaries",
          "Guidelines:",
          "- Be factual and neutral, avoid marketing language.",
          "- 5-8 sentences max; no lists unless absolutely necessary.",
          "- Use only provide summaries; Do not invent sources.",
        ].join("\n"),
      ),
      new HumanMessage(
        [
          `Question: ${input.q}`,
          "Summaries:",
          JSON.stringify(input.pageSummaries, null, 2),
        ].join("\n"),
      ),
    ]);

    const finalAns = (
      typeof res.content === "string" ? res.content : String(res.content)
    ).trim();

    const extractSources = input.pageSummaries.map((page) => page.url);

    return {
      answer: finalAns,
      sources: extractSources,
      mode: "web",
    };
  },
);

//lcel steps
//webSearchStep
//openAndSummarizeStep
//composeStep
// these are runnables, these won't run automatically
//we've to use runnalbe sequence to run them

export const webBasedPath = RunnableSequence.from([
  webSearchStep,
  openAndSummarizeStep,
  composeStep,
]);
