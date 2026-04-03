//this is the search the internet tool, it is going to call the tavily api
//we give it a natural language query (the user's query from frontend)
//it is going to call tavily under the hood and is going to return a WebSearchResultsSchema -> basically a clean array of search hits

import { env } from "../shared/env";
import { WebSearchResultSchema, WebSearchResultsSchema } from "./schema";

export async function webSearch(q: string) {
  const query = (q ?? "").trim();
  if (!query) return [];

  return await searchTavilyUtil(query);
}

async function searchTavilyUtil(query: string) {
  if (!env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const response = await fetch(`https://api.tavily.com/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_images: false,
    }),
  });

  if (!response.ok) {
    const text = await safeText(response);

    throw new Error("Tavily Error: " + response.status + " " + text);
  }

  const data = await response.json();

  const results = Array.isArray(data?.results) ? data.results : [];

  const normalized = results.slice(0, 5).map((r: any) =>
    WebSearchResultSchema.parse({
      title: String(r?.title ?? "").trim() || "Untitled", // String() makes x a string
      url: String(r?.url ?? "").trim(),
      snippet: String(r?.content ?? "")
        .trim()
        .slice(0, 220),
    }),
  );

  return WebSearchResultsSchema.parse(normalized);
}

export async function safeText(res: Response) {
  try {
    return await res.json();
  } catch (error) {
    return "<no body>";
  }
}
