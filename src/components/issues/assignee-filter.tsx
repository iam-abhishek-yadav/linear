"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UnassignedAvatar, UserAvatar } from "@/components/user-avatar";
import type { Member } from "@/hooks/use-members";
import { UNASSIGNED_ASSIGNEE_ID } from "@/lib/task-filters";
import { cn } from "@/lib/utils";

type AssigneeFilterProps = {
  members: Member[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
};

export function AssigneeFilter({
  members,
  selectedId,
  onSelect,
  onClear,
}: AssigneeFilterProps) {
  const [open, setOpen] = useState(false);
  const isFiltering = selectedId !== null;

  const sortedMembers = [...members].sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    return a.name.localeCompare(b.name);
  });

  const selectedMember =
    selectedId && selectedId !== UNASSIGNED_ASSIGNEE_ID
      ? members.find((member) => member.id === selectedId)
      : null;

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
  }

  function handleClear() {
    onClear();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-7 max-w-[140px] gap-1.5 rounded-[6px] px-2.5 text-[13px] font-normal sm:max-w-[180px]",
              isFiltering
                ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200"
                : "text-muted-foreground/70 hover:bg-white/[0.05] hover:text-foreground/80",
            )}
          />
        }
      >
        {selectedId === UNASSIGNED_ASSIGNEE_ID ? (
          <UnassignedAvatar size="xs" />
        ) : selectedMember ? (
          <UserAvatar name={selectedMember.name} size="xs" />
        ) : null}
        <span className="truncate">
          {selectedId === UNASSIGNED_ASSIGNEE_ID
            ? "Unassigned"
            : selectedMember?.name ?? "Assignee"}
        </span>
        <ChevronDown className="size-3 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-1">
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Filter by assignee
        </p>

        {isFiltering && (
          <button
            type="button"
            onClick={handleClear}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            All assignees
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSelect(UNASSIGNED_ASSIGNEE_ID)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
        >
          <UnassignedAvatar size="xs" />
          <span className="flex-1 text-left">Unassigned</span>
          {selectedId === UNASSIGNED_ASSIGNEE_ID && (
            <Check className="size-3.5 text-muted-foreground" />
          )}
        </button>

        {sortedMembers.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => handleSelect(member.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
          >
            <UserAvatar name={member.name} size="xs" />
            <span className="flex-1 truncate text-left">
              {member.name}
              {member.isCurrentUser && (
                <span className="text-muted-foreground"> (you)</span>
              )}
            </span>
            {selectedId === member.id && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
