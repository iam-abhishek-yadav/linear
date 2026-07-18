"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-medium text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="wrap-break-word leading-relaxed text-foreground/90">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-violet-300 underline underline-offset-2 hover:text-violet-200"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5 text-foreground/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="wrap-break-word leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-white/12 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-white/8" />,
  pre: ({ children }) => (
    <pre className="my-3 max-w-full wrap-break-word whitespace-pre-wrap rounded-md bg-black/35 px-3 py-3 font-mono text-[13px] leading-6 text-foreground/90">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);

    if (isBlock) {
      return (
        <code
          className={cn(
            "block wrap-break-word whitespace-pre-wrap",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="wrap-break-word rounded bg-white/6 px-1 py-0.5 font-mono text-[0.9em] text-foreground/90"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-3 max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-white/8 bg-white/4 px-3 py-2 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/8 px-3 py-2">{children}</td>
  ),
};

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-[15px] leading-relaxed text-muted-foreground/50">
        Nothing to preview yet.
      </p>
    );
  }

  return (
    <div className="markdown-preview min-w-0 max-w-full space-y-3 text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
