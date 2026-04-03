//this is going to fetch each and every url/page
//the LLM itself cannot browse the web
//our code -> act as a browser tool, decide what content is safe and what we want the model to show

//we fetch the url, strip all the unncessary infos and keep the article like content that we need

import { OpenUrlOutputSchema } from "./schema";
import { safeText } from "./webSearch";
import { convert } from "html-to-text";

export async function openUrl(url: string) {
  //step1
  const normalized = validateUrl(url);

  //step2 - fetch page by ourselves
  //some websites block generic node fetch, so we avoid 403 errors by using our own User-Agent
  const res = await fetch(normalized, {
    headers: {
      "User-Agent": "agent-core/1.0 (+course-demo)",
    },
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(
      "Error fetching url: " + res.status + " " + body.slice(0, 200),
    );
  }

  //step3 -
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();

  //step4 - raw HTML will be converted to normal or plain text
  const text = contentType.includes("text/html")
    ? convert(raw, {
        wordwrap: false,
        selectors: [
          {
            selector: "nav",
            format: "skip",
          },
          {
            selector: "header",
            format: "skip",
          },
          {
            selector: "footer",
            format: "skip",
          },
          {
            selector: "script",
            format: "skip",
          },
        ],
      })
    : raw;

  //step5
  const cleaned = collapseWhiteSpace(text);
  const capped = cleaned.slice(0, 8000);

  return OpenUrlOutputSchema.parse({
    url: normalized,
    content: capped,
  });
}

function validateUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new Error("Only http and https are supported");
    }

    return parsed.toString();
  } catch (error) {
    throw new Error("Invalid Url");
  }
}

function collapseWhiteSpace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
