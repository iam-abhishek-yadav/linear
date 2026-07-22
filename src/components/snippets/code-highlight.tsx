"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import type { CodeSnippetLanguage } from "@/db/schema";
import { cn } from "@/lib/utils";

const SHIKI_LANG: Record<CodeSnippetLanguage, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  html: "html",
  css: "css",
};

type CodeHighlightProps = {
  code: string;
  language: CodeSnippetLanguage;
  className?: string;
};

export function CodeHighlight({ code, language, className }: CodeHighlightProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const result = await codeToHtml(code, {
          lang: SHIKI_LANG[language],
          theme: "github-dark-default",
          transformers: [
            {
              line(node, line) {
                node.properties["data-line"] = String(line);
              },
            },
          ],
        });
        if (!cancelled) setHtml(result);
      } catch {
        if (!cancelled) setHtml(null);
      }
    }

    void highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    const lines = code.length === 0 ? [""] : code.split("\n");
    const width = String(lines.length).length;
    return (
      <div className={cn("inline-flex min-w-full", className)}>
        <pre className="select-none border-r border-white/6 bg-[#101012] px-3 py-4 text-right font-mono text-[12.5px] leading-6 text-muted-foreground/45">
          {lines.map((_, index) => (
            <div key={index} className="tabular-nums">
              {String(index + 1).padStart(width, " ")}
            </div>
          ))}
        </pre>
        <pre className="flex-1 px-4 py-4 font-mono text-[12.5px] leading-6 text-foreground/90 whitespace-pre">
          {lines.map((line, index) => (
            <div key={index}>{line.length > 0 ? line : " "}</div>
          ))}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn("snippet-shiki min-w-full overflow-x-auto", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
