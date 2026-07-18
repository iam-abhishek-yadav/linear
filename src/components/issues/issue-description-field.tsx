"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Braces,
  Code,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IssueDescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
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
    label: "Code block",
    icon: Braces,
    before: "```\n",
    after: "\n```",
    placeholder: "code",
    block: true,
  },
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

const INDENT = "  ";

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
    ? `${action.before}${snippet}${action.after ?? ""}`
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

function getLineRange(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEnd = Math.max(start, end);
  const nextNewline = value.indexOf("\n", selectionEnd);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  return { lineStart, lineEnd };
}

function indentSelection(value: string, start: number, end: number) {
  if (start === end) {
    const nextValue = value.slice(0, start) + INDENT + value.slice(end);
    return {
      nextValue,
      selectionStart: start + INDENT.length,
      selectionEnd: start + INDENT.length,
    };
  }

  const { lineStart, lineEnd } = getLineRange(value, start, end);
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const indented = lines.map((line) => INDENT + line).join("\n");
  const nextValue = value.slice(0, lineStart) + indented + value.slice(lineEnd);
  const lineIndex = value.slice(lineStart, start).split("\n").length - 1;
  const addedBefore = INDENT.length * lineIndex;
  const addedTotal = INDENT.length * lines.length;

  return {
    nextValue,
    selectionStart: start + addedBefore,
    selectionEnd: end + addedTotal - INDENT.length * (lines.length - lineIndex - 1),
  };
}

function outdentSelection(value: string, start: number, end: number) {
  const { lineStart, lineEnd } = getLineRange(value, start, end);
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  let removedBeforeStart = 0;
  let removedBeforeEnd = 0;
  let removedTotal = 0;

  const outdented = lines
    .map((line, index) => {
      let removed = 0;
      let nextLine = line;

      if (line.startsWith(INDENT)) {
        removed = INDENT.length;
        nextLine = line.slice(INDENT.length);
      } else if (line.startsWith("\t")) {
        removed = 1;
        nextLine = line.slice(1);
      }

      if (removed > 0) {
        removedTotal += removed;
        const lineOffset =
          lineStart + lines.slice(0, index).join("\n").length + (index > 0 ? 1 : 0);
        if (lineOffset < start) removedBeforeStart += removed;
        if (lineOffset + line.length <= end) removedBeforeEnd += removed;
      }

      return nextLine;
    })
    .join("\n");

  if (removedTotal === 0) {
    return null;
  }

  const nextValue = value.slice(0, lineStart) + outdented + value.slice(lineEnd);
  return {
    nextValue,
    selectionStart: Math.max(lineStart, start - removedBeforeStart),
    selectionEnd: Math.max(lineStart, end - removedBeforeEnd),
  };
}

function handleEditorKeyDown(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
  onSave?: () => void,
) {
  const textarea = event.currentTarget;

  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    onSave?.();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = event.shiftKey
      ? outdentSelection(value, start, end)
      : indentSelection(value, start, end);

    if (!result) return;

    onChange(result.nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
    return;
  }

  if (event.key === "Enter" && !event.shiftKey) {
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const currentLine = value.slice(lineStart, start);
    const indent = currentLine.match(/^\s*/)?.[0] ?? "";

    if (indent) {
      event.preventDefault();
      const nextValue = `${value.slice(0, start)}\n${indent}${value.slice(start)}`;
      onChange(nextValue);
      requestAnimationFrame(() => {
        const cursor = start + 1 + indent.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    }
  }
}

function renderInlineMarkdown(text: string) {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;
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

function renderMarkdownBlock(block: string, index: number) {
  const trimmed = block.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    const inner = trimmed.slice(3, -3);
    const newlineIndex = inner.indexOf("\n");
    const body =
      newlineIndex === -1
        ? ""
        : inner.slice(newlineIndex + 1).replace(/\n$/, "");

    return (
      <pre
        key={index}
        className="overflow-x-auto rounded-lg border border-white/8 bg-[#141416] p-4 font-mono text-[13px] leading-6 text-foreground/90"
      >
        <code>{body}</code>
      </pre>
    );
  }

  const lines = block.split("\n");
  const isBulletList =
    lines.length > 0 && lines.every((line) => /^-\s+/.test(line.trim()));
  const isNumberedList =
    lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line.trim()));

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
    <p key={index} className="whitespace-pre-wrap wrap-break-word">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {renderInlineMarkdown(line)}
        </span>
      ))}
    </p>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-[16px] leading-relaxed text-muted-foreground/50">
        Nothing to preview yet.
      </p>
    );
  }

  const blocks = content.split(/(```[\s\S]*?```)/g).filter((block) => block.length > 0);

  return (
    <div className="space-y-4 text-[16px] leading-relaxed text-foreground/90">
      {blocks.map((block, index) => renderMarkdownBlock(block, index))}
    </div>
  );
}

export function IssueDescriptionField({
  value,
  onChange,
  placeholder = "Add description…",
  dirty = false,
  saving = false,
  onSave,
  onDiscard,
}: IssueDescriptionFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-white/8 bg-white/2 p-0.5">
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

          {dirty && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={onSave}
                className="h-7 gap-1.5 rounded-md bg-violet-600 px-2.5 text-xs text-white hover:bg-violet-600/90"
              >
                {saving ? (
                  <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save className="size-3" />
                )}
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={onDiscard}
                className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="size-3" />
                Discard
              </Button>
            </div>
          )}
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
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/4 hover:text-foreground"
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
          onKeyDown={(event) =>
            handleEditorKeyDown(event, value, onChange, onSave)
          }
          placeholder={placeholder}
          spellCheck={false}
          className="field-sizing-content min-h-32 w-full resize-y rounded-lg border border-white/8 bg-[#141416]/40 px-4 py-3 font-mono text-[14px] leading-6 text-foreground/90 outline-none placeholder:text-muted-foreground/50 focus:border-white/14"
        />
      ) : (
        <div className="min-h-32 rounded-lg border border-white/8 bg-[#141416]/20 px-4 py-3">
          <MarkdownPreview content={value} />
        </div>
      )}

      {mode === "edit" && (
        <p className="mt-2 text-[12px] text-muted-foreground/70">
          Tab indents, Shift+Tab outdents, Enter keeps indentation. Use ``` for
          code blocks. Cmd/Ctrl+S to save.
        </p>
      )}
    </div>
  );
}
