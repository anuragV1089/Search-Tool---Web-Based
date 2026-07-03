"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChangeEvent, FormEvent, useState } from "react";
import { API_URL } from "@/lib/config";
import { Separator } from "@/components/ui/separator";

type Source = {
  source: string;
  chunkId: number;
};

type AskResponse = {
  answer: string;
  sources: Source[];
  confidence: number;
};

type IngestResult = {
  ok: boolean;
  docCount: number;
  chunkCount: number;
  source: string;
};

export default function LightRagKB() {
  const [ingestText, setIngestText] = useState("");
  const [ingestSource, setIngestSource] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(2);
  const [askLoading, setAskLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [answerData, setAnswerData] = useState<AskResponse | null>(null);
  const [showSources, setShowSources] = useState(false);

  async function handleIngest(event: ChangeEvent) {
    event.preventDefault();
    setIngestLoading(true);
    setIngestMessage(null);

    try {
      const res = await fetch(`${API_URL}/kb/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: ingestText,
          source: ingestSource || undefined,
        }),
      });
      const json: IngestResult | { error: string } = await res.json();
      if (!res.ok) {
        throw new Error("Ingest failed");
      }

      const result = json as IngestResult;
      setIngestMessage(`Ingested ${result.chunkCount} from ${result.source}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIngestLoading(false);
    }
  }

  async function handleAskQuerySubmit(event: FormEvent) {
    event.preventDefault();
    setAskLoading(true);
    setAnswerData(null);
    setTime(null);

    const time = performance.now();
    try {
      const res = await fetch(`${API_URL}/kb/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
          k: topK,
        }),
      });
      const json: AskResponse | { error: string } = await res.json();
      if (!res.ok) {
        throw new Error("Ask failed");
      }

      setAnswerData(json as AskResponse);
    } catch (error) {
      console.log(error);
    } finally {
      setTime(Math.round(performance.now() - time));
      setAskLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Knowledge Base(KB)
        </h1>
        <p className="text-sm text-muted-foreground">
          Light RAG Demo. Add your own docs, then ask questions. Model must
          answer from what you have ingested.
        </p>
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Add to KB</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIngest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor=""
                  className="text-xs font-medium text-muted-foreground"
                >
                  Source Label
                </label>
                <Input
                  placeholder="Add your source here..."
                  className="text-sm"
                  value={ingestSource}
                  onChange={(event) => setIngestSource(event.target.value)}
                ></Input>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor=""
                  className="text-xs font-medium text-muted-foreground"
                >
                  Text / Markdown
                </label>
                <Textarea
                  className="min-h-50 font-mono text-xs leading-relaxed resize-y "
                  placeholder="Paste docs, policy text or any onboarding notes ... "
                  value={ingestText}
                  onChange={(event) => setIngestText(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary">
                  Reset
                </Button>
                <Button type="submit">
                  {ingestLoading ? "Ingesting..." : "Ingest to KB"}
                </Button>
              </div>
            </form>
            <div className="text-xs">
              {ingestMessage ? (
                <div className="text-green-500">{ingestMessage}</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Your Question/Query
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <form
              onSubmit={handleAskQuerySubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor=""
                  className="text-xs font-medium text-muted-foreground"
                >
                  Your Query
                </label>
                <Input
                  placeholder="Ask your question here..."
                  className="text-sm"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                ></Input>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor=""
                  className="text-xs font-medium text-muted-foreground"
                >
                  Top K Answers
                </label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="text-sm"
                  value={topK}
                  onChange={(event) =>
                    setTopK(parseInt(event.target.value || "2", 5))
                  }
                ></Input>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit">
                  {askLoading ? "Asking..." : "Ask KB"}
                </Button>
              </div>
            </form>
            {answerData && (
              <div className="flex flex-col gap-4 pt-5">
                <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {answerData.answer}
                </div>
                <div className="text-[12px] text-green-600">Time {time}ms</div>
                {showSources && (
                  <div className="flex flex-col gap-2">
                    <span>Sources ({answerData.sources.length})</span>
                    <Separator>
                      <ul className="space-y-3">
                        {answerData.sources.map((source, index) => (
                          <li key={index} className="text-xs">
                            <div className="font-medium text-foreground">
                              {source.source}
                              <span>#{source.chunkId}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Separator>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
