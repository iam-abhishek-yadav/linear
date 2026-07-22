"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  FileCode2,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { useMembersContext } from "@/components/members-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/session-provider";
import { CodeHighlight } from "@/components/snippets/code-highlight";
import { useSnippets } from "@/hooks/use-snippets";
import type { CodeSnippetLanguage } from "@/db/schema";
import type { SnippetItem } from "@/lib/snippets";
import {
  CODE_SNIPPET_LANGUAGES,
  CODE_SNIPPET_LANGUAGE_EXTENSIONS,
  CODE_SNIPPET_LANGUAGE_LABELS,
} from "@/lib/snippet-validations";
import { formatRelativeDate, getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type Tab = "received" | "sent";
type Mode = "compose" | "detail" | "empty";

function fileNameOf(snippet: SnippetItem) {
  const name = snippet.title?.trim();
  return name && name.length > 0 ? name : "unnamed";
}

function FileRow({
  snippet,
  selected,
  onSelect,
}: {
  snippet: SnippetItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors",
        selected
          ? "bg-white/8 text-foreground"
          : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
      )}
    >
      <span className="flex w-2 shrink-0 justify-center">
        {snippet.unread ? (
          <span className="size-1.5 rounded-full bg-violet-500" />
        ) : (
          <span className="size-1.5" />
        )}
      </span>
      <FileCode2 className="size-3.5 shrink-0 opacity-60" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-mono text-[12.5px]",
          snippet.unread && "font-medium text-foreground",
        )}
      >
        {fileNameOf(snippet)}
      </span>
    </button>
  );
}

function ComposePanel({
  onSent,
  onCancel,
}: {
  onSent: (snippet: SnippetItem) => void;
  onCancel: () => void;
}) {
  const { user } = useSession();
  const members = useMembersContext();
  const { createSnippet, creating } = useSnippets();
  const teammates = useMemo(
    () => members.filter((member) => member.id !== user.id),
    [members, user.id],
  );

  const [filename, setFilename] = useState("file.ts");
  const [language, setLanguage] = useState<CodeSnippetLanguage>("typescript");
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touchedFilename, setTouchedFilename] = useState(false);

  const recipient = teammates.find((member) => member.id === recipientId);

  function handleLanguageChange(next: CodeSnippetLanguage) {
    setLanguage(next);
    if (!touchedFilename) {
      setFilename(`file${CODE_SNIPPET_LANGUAGE_EXTENSIONS[next]}`);
    }
  }

  async function handleSend() {
    setError(null);
    const name = filename.trim();
    if (!name) {
      setError("Filename is required");
      return;
    }
    if (!/^[\w.-]+$/.test(name)) {
      setError("Filename can only use letters, numbers, dots, dashes, or underscores");
      return;
    }
    if (!recipientId) {
      setError("Choose a teammate");
      return;
    }
    if (!body.trim()) {
      setError("Paste a code file first");
      return;
    }

    try {
      const snippet = await createSnippet({
        title: name,
        language,
        body: body.trim(),
        recipientId,
      });
      onSent(snippet);
    } catch {
      setError("Could not share the file. Try again.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-medium">Share a file</h2>
          <p className="text-[12px] text-muted-foreground">
            For code handoffs — not realtime chat.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
            Filename
          </p>
          <input
            value={filename}
            onChange={(event) => {
              setTouchedFilename(true);
              setFilename(event.target.value);
            }}
            placeholder="useAuth.ts"
            spellCheck={false}
            className="w-full rounded-md border border-white/8 bg-[#121214] px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">
            Language
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CODE_SNIPPET_LANGUAGES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleLanguageChange(value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] transition-colors",
                  language === value
                    ? "bg-violet-500/20 text-violet-200"
                    : "bg-white/4 text-muted-foreground hover:bg-white/6 hover:text-foreground",
                )}
              >
                {CODE_SNIPPET_LANGUAGE_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-medium text-muted-foreground">
            Send to
          </p>
          {teammates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other members in this workspace yet.
            </p>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full max-w-sm items-center gap-2 rounded-md border border-white/8 bg-white/2 px-3 py-2 text-left text-sm hover:bg-white/4"
                  />
                }
              >
                {recipient ? (
                  <>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                        getAvatarColor(recipient.name),
                      )}
                    >
                      {getInitials(recipient.name)}
                    </span>
                    <span className="flex-1 truncate">{recipient.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Choose a teammate…</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {teammates.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => setRecipientId(member.id)}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                        getAvatarColor(member.name),
                      )}
                    >
                      {getInitials(member.name)}
                    </span>
                    <span className="flex-1 truncate">{member.name}</span>
                    {member.id === recipientId && (
                      <Check className="size-3.5 text-muted-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="min-h-0 flex-1">
          <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
            File contents
          </p>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="// Paste a file or code…"
            spellCheck={false}
            className="min-h-72 w-full resize-y rounded-md border border-white/8 bg-[#0d0d0f] px-3 py-3 font-mono text-[13px] leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50"
          />
          <p className="mt-2 text-[12px] text-muted-foreground/70">
            Code is auto-formatted when you share (TS/JS/HTML/CSS). Not realtime
            chat — the other person picks it up on refresh.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/6 px-4 py-3">
        <Button
          type="button"
          disabled={creating || teammates.length === 0}
          onClick={() => void handleSend()}
          className="gap-1.5"
        >
          {creating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Share
        </Button>
      </div>
    </div>
  );
}

function CodeViewer({ snippet }: { snippet: SnippetItem }) {
  const [copied, setCopied] = useState(false);
  const counterpart =
    snippet.direction === "received" ? snippet.author : snippet.recipient;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0d0d0f]">
      <div className="flex items-center gap-2 border-b border-white/6 bg-[#121214] px-3 py-2">
        <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
          {fileNameOf(snippet)}
        </span>
        <span className="hidden rounded bg-white/6 px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline">
          {CODE_SNIPPET_LANGUAGE_LABELS[snippet.language]}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void handleCopy()}
          className="h-7 gap-1.5 px-2 text-xs"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/6 px-3 py-2 text-[12px] text-muted-foreground">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
            getAvatarColor(counterpart.name),
          )}
        >
          {getInitials(counterpart.name)}
        </span>
        <span className="truncate">
          {snippet.direction === "received" ? "From" : "To"}{" "}
          <span className="text-foreground/80">{counterpart.name}</span>
          <span className="text-muted-foreground/50"> · </span>
          {formatRelativeDate(new Date(snippet.createdAt))}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CodeHighlight code={snippet.body} language={snippet.language} />
      </div>
    </div>
  );
}

export function SnippetsPage() {
  const { snippets, loading, markRead } = useSnippets();
  const [tab, setTab] = useState<Tab>("received");
  const [mode, setMode] = useState<Mode>("empty");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => snippets.filter((snippet) => snippet.direction === tab),
    [snippets, tab],
  );

  const selected = useMemo(
    () => snippets.find((snippet) => snippet.id === selectedId) ?? null,
    [snippets, selectedId],
  );

  useEffect(() => {
    if (mode !== "detail" || !selected?.unread) return;
    void markRead(selected.id);
  }, [mode, selected?.id, selected?.unread, markRead]);

  function openFile(id: string) {
    setSelectedId(id);
    setMode("detail");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/6 px-4 py-3">
        <SidebarTrigger />
        <Code2 className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <h1 className="text-sm font-medium leading-tight">Share</h1>
          <p className="text-[11px] text-muted-foreground">
            Send code files to a teammate — not a chat
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-white/6 bg-[#0f0f11]">
          <div className="flex items-center gap-1 border-b border-white/6 p-2">
            <div className="flex flex-1 rounded-md bg-white/3 p-0.5">
              {(["received", "sent"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTab(value);
                    setMode("empty");
                    setSelectedId(null);
                  }}
                  className={cn(
                    "flex-1 rounded px-2 py-1 text-[11px] capitalize transition-colors",
                    tab === value
                      ? "bg-white/8 font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setMode("compose");
                setSelectedId(null);
              }}
              aria-label="Share a file"
              title="Share a file"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] leading-relaxed text-muted-foreground">
                {tab === "received"
                  ? "No files yet. Teammates can share code files with you here."
                  : "Share a code file with someone in your workspace."}
              </p>
            ) : (
              filtered.map((snippet) => (
                <FileRow
                  key={snippet.id}
                  snippet={snippet}
                  selected={selectedId === snippet.id && mode === "detail"}
                  onSelect={() => openFile(snippet.id)}
                />
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {mode === "compose" ? (
            <ComposePanel
              onSent={(snippet) => {
                setTab("sent");
                openFile(snippet.id);
              }}
              onCancel={() => setMode(selected ? "detail" : "empty")}
            />
          ) : mode === "detail" && selected ? (
            <CodeViewer snippet={selected} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#0d0d0f] px-6 text-center">
              <FileCode2 className="size-8 text-muted-foreground/35" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Select a file on the left, or share a new one. Built for code
                handoffs — not realtime messaging.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
