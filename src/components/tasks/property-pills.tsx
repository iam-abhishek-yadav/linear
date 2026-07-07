"use client";

import { useRef } from "react";
import { CalendarClock, Check, CircleUser, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { StatusIcon } from "@/components/tasks/status-icon";
import type { Member } from "@/hooks/use-members";
import { COLUMNS, getPriorityMeta, getStatusMeta, PRIORITIES } from "@/lib/constants";
import { formatDueDate, isOverdue } from "@/lib/task-utils";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

const pillClass =
  "h-7 gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs font-normal text-muted-foreground hover:bg-muted/40 hover:text-foreground";

export function StatusPill({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  const meta = getStatusMeta(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" className={pillClass} />}
      >
        <StatusIcon status={value} />
        {meta.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Change status…
          </DropdownMenuLabel>
          {COLUMNS.map((col, i) => (
            <DropdownMenuItem key={col.id} onClick={() => onChange(col.id)}>
              <StatusIcon status={col.id} />
              <span className="flex-1">{col.label}</span>
              {value === col.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">{i + 1}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PriorityPill({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}) {
  const meta = getPriorityMeta(value);
  const label = value === "NONE" ? "Priority" : meta.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" className={pillClass} />}
      >
        <PriorityIcon priority={value} />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Set priority…
          </DropdownMenuLabel>
          {PRIORITIES.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => onChange(p.id)}>
              <PriorityIcon priority={p.id} />
              <span className="flex-1">{p.label}</span>
              {value === p.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MiniAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white",
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export function AssigneePill({
  value,
  members,
  onChange,
}: {
  value: string | null;
  members: Member[];
  onChange: (assigneeId: string | null) => void;
}) {
  const assignee = members.find((m) => m.id === value) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" className={pillClass} />}
      >
        {assignee ? (
          <MiniAvatar name={assignee.name} />
        ) : (
          <CircleUser className="size-3.5" />
        )}
        {assignee ? assignee.name : "Assignee"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Assign to…
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onChange(null)}>
            <CircleUser className="size-3.5 text-muted-foreground" />
            <span className="flex-1">No assignee</span>
            {!value && <Check className="size-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
          {members.map((member) => (
            <DropdownMenuItem key={member.id} onClick={() => onChange(member.id)}>
              <MiniAvatar name={member.name} />
              <span className="flex-1 truncate">
                {member.name}
                {member.isCurrentUser && (
                  <span className="text-muted-foreground"> (you)</span>
                )}
              </span>
              {value === member.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DueDatePill({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dueDate: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = value ? formatDueDate(value) : "ETA";
  const overdue = value ? isOverdue(value) : false;

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }

  return (
    <span
      className={cn(
        "relative inline-flex h-7 items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs font-normal text-muted-foreground transition-colors",
        value && !overdue && "text-foreground",
        overdue && "border-red-500/30 text-red-400",
      )}
    >
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground"
      >
        <CalendarClock className="size-3.5" />
        {label}
      </button>
      {value && (
        <button
          type="button"
          aria-label="Clear ETA"
          onClick={() => onChange(null)}
          className="-mr-0.5 rounded-sm p-0.5 text-muted-foreground/70 hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
      <input
        ref={inputRef}
        type="date"
        aria-label="Set ETA"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-2 size-0 opacity-0"
      />
    </span>
  );
}

export function PropertyPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
