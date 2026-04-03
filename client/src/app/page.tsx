"use client";

import { useState, useRef } from "react";

type SearchResponse = {
  answer: string;
  sources: string[];
};

type CurrentChatTurn =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
      sources: string[];
      time: number;
      error?: string;
    };

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<CurrentChatTurn[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex h-dvh flex-col bg-[#f9fafb] text-gray-900 ">
      <header className="border-b bg-white px-4 py-3 text-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            Search V1 (LCEL Web Agent)
          </span>
          <span className="text-[11px] text-gray-500">
            Answer with sources. Some queries browse the web and some don't.
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6"></main>
    </div>
  );
}
