// the search agent has 2 possible paths
//1. web-path -> browse, summarize, cite urls
//2. direct-path -> LLM knows the answer
// both things must return data in same state so that runnable can switch between them easily
//that shared shape of return data is called "candidate"

export type Candidate = {
  answer: string;
  sources: string[]; // in direct path this will be empty
  mode: "web" | "direct";
};
