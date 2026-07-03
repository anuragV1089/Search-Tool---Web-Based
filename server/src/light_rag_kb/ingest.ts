//what is happening here
//1. chunk the text using fixed chunk rules
//2. Embedd each chunk into vectors
//3. Push all these vectors in memory store
//4. Return a summary so UI can say
//   -> added 1 document with "this many chunks(20, 5, 6)" from "this file"

//when building any kind of production level RAG we'll always have 2 pipelines
// 1. ingest/indexing -> prepare knowledge
// 2. retrieval/answering -> get answers after using knowledge

// 1 doc -> break into chunks -> source #0, #1
//Sangam -> Sa(#0) -> an(#1) -> gam(#2)
//now if we want to find an so we'll get something like we're getting the answer from source #1

import { chunkText } from "./chunk";
import { addChunks } from "./store";

export type IngestTextInput = {
  text: string;
  source?: string;
};

export async function ingestText(input: IngestTextInput) {
  const raw = (input.text ?? "").trim();
  if (!raw) {
    throw new Error("No file to ingest");
  }

  const source = input.source ?? "pasted-text";

  const docs = chunkText(raw, source);

  //embed each chunk and to our created vector store

  const chunkCount = await addChunks(docs);

  return {
    docCount: 1,
    chunkCount,
    source,
  };
}
