//what is happening here?
//ask the KB -> retrieval and answer
//example query -> what is our refund policy for late payments?

//steps
//1. Turn the query of plain english to vector -> array of numbers (embedding)
//Use same embeddings model(used during indexing/ingestion) to embed the query
//Embedding done by one model is meaningless to any other model
//2. Retrive most similar chunks from the vector store
//3. Build a grounded answer
//4. Build a prompt
//5. Tell the model -> use given context ans say no if answer is not there
//model is going to give final answer

//confidence -> we average the similarity score -> 0 to 1

// { answer: "", sources: [], confidence: 0.5}

import { getVectorStore } from "./store";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export type KBSource = {
  source: string;
  chunkId: number;
};

export type KBAskResult = {
  answer: string;
  sources: KBSource[];
  confidence: number;
};

//currently 2 chunks
//[#1] doc.md #0
//[#2] doc.md #1

//going to return human readable header for each chunk
function buildContext(chunks: { text: string; meta: any }[] = []) {
  return chunks
    .map(
      ({ text, meta }, i) =>
        [
          `[#${i + 1}] ${String(meta?.source ?? "unknown")} #${String(meta?.chunkId ?? "?")}`,
          text ?? "Empty Text",
        ].join("\n"), //ye chunk header aur text ko join kr rha
    )
    .join("\n\n---\n\n"); //ye naye mapped array ko join kr rha
}

async function buildFinalAnswerFromLLM(query: string, context: string) {
  const model = getChatModel({ temperature: 0.2 });

  const response = await model.invoke([
    new SystemMessage(
      [
        "You are a helpful assistant that answers only using the provided context.",
        "If the answer is not found in the current context, say so briefly",
        "Be concise (4 - 5 sentences max), neutral, and avoid any marketing info.",
        "Do not fabricate sources or site anything that is not in the context.",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        `Question: ${query}`,
        "",
        `Context: (quoted chunks) ->`,
        context || "no relevant context",
      ].join("\n"),
    ),
  ]);

  const finalRes =
    typeof response.content === "string"
      ? response.content
      : String(response.content);

  return finalRes.trim().slice(0, 1000);
}

function buildConfidence(scores: number[]): number {
  if (scores.length === 0) return 0;

  const clamped = scores.map((score) => Math.max(0, Math.min(1, score)));

  const avg = clamped.reduce((a, b) => a + b, 0);

  return Math.round(avg * 100) / 100; //rounding off to 2 decimal places
}

//k = number of results to return
export async function askKB(query: string, k = 2): Promise<KBAskResult> {
  const validateCurrentQuery = (query ?? "").trim();
  if (!validateCurrentQuery) {
    throw new Error("Query is empty, please try again!");
  }

  const store = getVectorStore();
  console.log(store);
  //embed the query
  const embedQuery = await store.embeddings.embedQuery(validateCurrentQuery);
  console.log(embedQuery);
  //how pairs look
  //[
  // [Document{pagecontent, metadata}, score], [Document{pagecontent, metadata}, score]
  //]

  const pairs = await store.similaritySearchVectorWithScore(embedQuery, k);

  const chunks = pairs.map(([doc]) => {
    return {
      text: doc.pageContent || "",
      meta: doc.metadata || {},
    };
  });

  const scores = pairs.map(([, score]) => Number(score) || 0); //this is for confidence

  //prompt context
  const context = buildContext(chunks);

  const answer = await buildFinalAnswerFromLLM(validateCurrentQuery, context);

  const sources: KBSource[] = chunks.map((c) => ({
    source: String(c.meta?.source ?? "unknown"),
    chunkId: Number(c.meta.chunkId) ?? 0,
  }));

  const confidence = buildConfidence(scores);

  return {
    answer,
    sources,
    confidence,
  };
}
