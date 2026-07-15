"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/session-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useOpenIssue, usePrefetchIssueDetail } from "@/hooks/use-open-issue";
import { useMembersCache } from "@/hooks/use-members-cache";
import { useTasks } from "@/hooks/use-tasks";
import { COLUMNS } from "@/lib/constants";
import {
  buildTaskIdentifierIndex,
  formatIdentifierFromIndex,
  getProjectKey,
} from "@/lib/task-utils";

export const GLOBAL_SEARCH_OPEN_EVENT = "global-search:open";

export function openGlobalSearch() {
  window.dispatchEvent(new Event(GLOBAL_SEARCH_OPEN_EVENT));
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function GlobalSearch() {
  const openIssue = useOpenIssue();
  const prefetchIssue = usePrefetchIssueDetail();
  const { organization } = useSession();
  const { tasks } = useTasks();
  const members = useMembersCache();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const projectKey = getProjectKey(organization.name);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const issueItems = useMemo(() => {
    if (!open) return [];

    const identifierIndex = buildTaskIdentifierIndex(tasks);
    const sorted = [...tasks].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return sorted.map((task) => {
      const identifier = formatIdentifierFromIndex(
        identifierIndex,
        task.id,
        projectKey,
      );
      const statusLabel =
        COLUMNS.find((column) => column.id === task.status)?.label ??
        task.status;
      const assignee = task.assigneeId
        ? memberById.get(task.assigneeId)
        : null;

      return {
        id: task.id,
        title: task.title,
        identifier,
        statusLabel,
        assigneeName: assignee?.name ?? null,
        value: [
          identifier,
          task.title,
          statusLabel,
          assignee?.name,
          assignee?.email,
          task.description,
        ]
          .filter(Boolean)
          .join(" "),
      };
    });
  }, [open, memberById, projectKey, tasks]);

  const visibleIssues = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return issueItems.slice(0, 12);
    }

    return issueItems
      .filter((issue) => issue.value.toLowerCase().includes(normalized))
      .slice(0, 30);
  }, [issueItems, query]);

  function handleOpenIssue(id: string) {
    setOpen(false);
    openIssue(id);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search issues across the workspace"
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search issues..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.trim() ? "No issues found." : "No issues yet."}
        </CommandEmpty>
        <CommandGroup heading={query.trim() ? "Results" : "Recent"}>
          {visibleIssues.map((issue) => (
            <CommandItem
              key={issue.id}
              value={issue.value}
              onSelect={() => handleOpenIssue(issue.id)}
              onMouseEnter={() => prefetchIssue(issue.id)}
            >
              <span className="w-16 shrink-0 font-mono text-[12px] text-muted-foreground">
                {issue.identifier}
              </span>
              <span className="min-w-0 flex-1 truncate">{issue.title}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground">
                {issue.statusLabel}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
