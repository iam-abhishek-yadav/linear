"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Tag } from "lucide-react";
import { TagBadge } from "@/components/tasks/tag-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TaskTagSummary } from "@/lib/tags";
import { cn } from "@/lib/utils";

const rowClass =
  "h-8 w-full justify-start gap-2 rounded-md px-2 text-[14px] font-normal text-foreground hover:bg-white/[0.04]";

export function LabelsRow({
  value,
  onChange,
  variant = "row",
}: {
  value: TaskTagSummary[];
  onChange: (tags: TaskTagSummary[]) => void | Promise<void>;
  variant?: "pill" | "row";
}) {
  const [open, setOpen] = useState(false);
  const [orgTags, setOrgTags] = useState<TaskTagSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedIds = new Set(value.map((tag) => tag.id));

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadTags() {
      setLoading(true);
      const response = await fetch("/api/tags");
      const data = await response.json();
      if (!cancelled && response.ok) {
        setOrgTags(data.tags ?? []);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadTags();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function toggleTag(tag: TaskTagSummary) {
    const next = selectedIds.has(tag.id)
      ? value.filter((item) => item.id !== tag.id)
      : [...value, tag];

    await onChange(next);
  }

  async function handleCreateLabel() {
    const name = newLabel.trim();
    if (!name) {
      return;
    }

    setCreating(true);
    setCreateError(null);

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    setCreating(false);

    if (!response.ok) {
      setCreateError(data.error?.name?.[0] ?? "Failed to create label");
      return;
    }

    const created: TaskTagSummary = data.tag;
    setOrgTags((current) =>
      [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNewLabel("");
    await onChange([...value, created]);
  }

  const triggerClass = variant === "row" ? rowClass : undefined;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "row" ? "ghost" : "outline"}
            className={cn(
              variant === "row"
                ? triggerClass
                : "h-7 min-h-7 justify-start gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs font-normal text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          />
        }
      >
        <Tag className="size-3.5 shrink-0 opacity-70" />
        {value.length > 0 ? (
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {value.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">Add labels</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Labels
          </DropdownMenuLabel>
          {loading ? (
            <DropdownMenuItem disabled>Loading labels...</DropdownMenuItem>
          ) : orgTags.length === 0 ? (
            <DropdownMenuItem disabled>No labels yet</DropdownMenuItem>
          ) : (
            orgTags.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => toggleTag(tag)}>
                <TagBadge tag={tag} />
                <span className="flex-1" />
                {selectedIds.has(tag.id) && (
                  <Check className="size-3.5 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-2">
          <p className="text-xs text-muted-foreground">Create label</p>
          <div className="flex gap-2">
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="e.g. Bug"
              className="h-8 text-sm"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateLabel();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 px-2"
              disabled={creating || !newLabel.trim()}
              onClick={() => void handleCreateLabel()}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
