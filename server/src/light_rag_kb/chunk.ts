// why we chunk? -> in rag when we do retrieval, it actually searches the chunk of text

//we want each chunk to be -> small enough but also big enough that it contains the full idea or the definition that we are asking for

//in this file -> slice long piece of text into overlapping windows
// then attach metadata to each window to find it faster

import { Document } from "@langchain/core/documents";

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

//text could be -> markdown, article, policy
//sources -> what is his name? -> sangam (source #0)
//vector store related APIs expect document in return

//chunkSize = 10, overlap = 3 and text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
//step = chunkSize - overlap = 7
//start=0 -> slice[0:10] = "ABCDEFGHIJ" chunk#0
//start=7 -> slice[7:17] = "IJKLMNOPQR" chunk#1
//overlap is mainly so that LLM doesn't loose context of previous chunk
export function chunkText(text: string, source: string): Document[] {
  const clean = (text ?? "").replace(/\r\n/g, "\n");

  const docs: Document[] = [];

  if (!clean.trim()) return docs;

  const step = Math.max(CHUNK_SIZE - CHUNK_OVERLAP, 1);

  let start = 0;
  let chunkId = 0;

  while (start < clean.length) {
    const end = Math.min(clean.length, start + CHUNK_SIZE);

    //remove leading/trailing whitespace
    const slice = clean.slice(start, end).trim();

    if (slice.length > 0) {
      docs.push(
        new Document({
          pageContent: slice, //mandatory
          metadata: {
            //optional
            source,
            chunkId,
          },
        }),
      );

      chunkId++;
    }

    start += step;
  }

  return docs;
}
