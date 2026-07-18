"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IssueDescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type FormatAction = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  before: string;
  after?: string;
  placeholder?: string;
  block?: boolean;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { label: "Bold", icon: Bold, before: "**", after: "**", placeholder: "bold" },
  {
    label: "Italic",
    icon: Italic,
    before: "*",
    after: "*",
    placeholder: "italic",
  },
  { label: "Code", icon: Code, before: "`", after: "`", placeholder: "code" },
  {
    label: "Link",
    icon: Link2,
    before: "[",
    after: "](url)",
    placeholder: "text",
  },
  {
    label: "Bullet list",
    icon: List,
    before: "- ",
    after: "",
    placeholder: "item",
    block: true,
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    before: "1. ",
    after: "",
    placeholder: "item",
    block: true,
  },
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  action: FormatAction,
  value: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const snippet = selected || action.placeholder || "";
  const formatted = action.block
    ? `${action.before}${snippet}`
    : `${action.before}${snippet}${action.after ?? action.before}`;

  const nextValue = value.slice(0, start) + formatted + value.slice(end);
  onChange(nextValue);

  requestAnimationFrame(() => {
    textarea.focus();
    const cursorStart = start + action.before.length;
    const cursorEnd = cursorStart + snippet.length;
    textarea.setSelectionRange(cursorStart, cursorEnd);
  });
}

function renderInlineMarkdown(text: string) {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-white/6 px-1 py-0.5 font-mono text-[0.9em] text-foreground/90"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-[16px] leading-relaxed text-muted-foreground/50">
        Nothing to preview yet.
      </p>
    );
  }

  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-4 text-[16px] leading-relaxed text-foreground/90">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isBulletList = lines.every((line) => /^-\s+/.test(line.trim()));
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line.trim()));

        if (isBulletList) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderInlineMarkdown(line.replace(/^-\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  {renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function IssueDescriptionField({
  value,
  onChange,
  placeholder = "Add description…",
}: IssueDescriptionFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 rounded-md border border-white/8 bg-white/[0.02] p-0.5">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors",
              mode === "edit"
                ? "bg-white/8 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Pencil className="size-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors",
              mode === "preview"
                ? "bg-white/8 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="size-3" />
            Preview
          </button>
        </div>

        {mode === "edit" && (
          <div className="flex flex-wrap items-center gap-0.5">
            {FORMAT_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  onClick={() => {
                    const textarea = textareaRef.current;
                    if (!textarea) return;
                    applyFormat(textarea, action, value, onChange);
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="field-sizing-content min-h-24 w-full resize-none bg-transparent text-[16px] leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50"
        />
      ) : (
        <div className="min-h-24">
          <MarkdownPreview content={value} />
        </div>
      )}
    </div>
  );
}
