//embeddings + vector store(in memory)
//kb brain -> knowledge base
//picks and embedding model -> openai | gemini
//stores ur embeddings in ram
//letting us insert chunks and later we can run search on based on those chunks

//core concepts
//embedding model -> turns this text into array of numbers/vector
//diff providors use different vector spaces

//vector store -> searchable index
//simply telling vector store that this is my query and your task is to find the closest chunks
import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

type Provider = "openai" | "google";

function getProvider(): Provider {
  const getCurrentProvider = (
    process.env.RAG_MODEL_PROVIDER ?? "gemini"
  ).toLocaleLowerCase();

  return getCurrentProvider === "gemini" ? "google" : "openai";
}

//create embeddings client

function makeOpenAiEmbeddings() {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  return new OpenAIEmbeddings({
    apiKey: key,
    model: "text-embedding-3-small",
  });
}

function makeGoogleEmbeddings() {
  const key = process.env.GOOGLE_API_KEY ?? "";
  if (!key) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  return new GoogleGenerativeAIEmbeddings({
    apiKey: key,
    model: "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

//learn about embeddings and vectors more thoroughly
function makeEmbeddings(provider: Provider) {
  return provider === "google"
    ? makeGoogleEmbeddings()
    : makeOpenAiEmbeddings();
}

//vector store
let store: MemoryVectorStore | null = null;
let currentSetProvider: Provider | null = null;

export function getVectorStore(): MemoryVectorStore {
  const provider = getProvider();

  //same provider means no change in env, keep existing store in memory
  if (store && currentSetProvider === provider) {
    return store;
  }

  //provider changed or first time call - build a brand new store
  store = new MemoryVectorStore(makeEmbeddings(provider));
  currentSetProvider = provider;

  return store;
}

//input -> docs
//Document({
//   pageContent: slice, //mandatory
//   metadata: {
//     //optional
//     source,
//     chunkId,
//   },
// }),

//process->
//1. get singleton vector store
//2. store will have method to add chunks
//3. store the docs in-memory
//4. return chunk count or docs length

export async function addChunks(docs: Document[]): Promise<number> {
  if (!Array.isArray(docs) || docs.length === 0) return 0;

  const store = getVectorStore();

  await store.addDocuments(docs);

  return docs.length;
}

export function resetStore() {
  store = null;
  currentSetProvider = null;
}
