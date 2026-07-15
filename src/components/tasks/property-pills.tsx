"use client";

import { useRef } from "react";
import { CalendarClock, Check, CircleUser, FolderKanban, X } from "lucide-react";
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
import { UserAvatar } from "@/components/user-avatar";
import type { Member } from "@/hooks/use-members";
import { COLUMNS, getPriorityMeta, getStatusMeta, PRIORITIES } from "@/lib/constants";
import { formatDueDate, isOverdue } from "@/lib/task-utils";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const pillClass =
  "h-7 gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs font-normal text-muted-foreground hover:bg-muted/40 hover:text-foreground";

const rowClass =
  "h-8 w-full justify-start gap-2 rounded-md px-2 text-[14px] font-normal text-foreground hover:bg-white/[0.04]";

export function StatusPill({
  value,
  onChange,
  variant = "pill",
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  variant?: "pill" | "row";
}) {
  const meta = getStatusMeta(value);
  const triggerClass = variant === "row" ? rowClass : pillClass;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "row" ? "ghost" : "outline"}
            className={triggerClass}
          />
        }
      >
        <StatusIcon status={value} />
        <span className="flex-1 truncate text-left">{meta.label}</span>
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
  variant = "pill",
}: {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  variant?: "pill" | "row";
}) {
  const meta = getPriorityMeta(value);
  const label =
    value === "NONE"
      ? variant === "row"
        ? "No priority"
        : "Priority"
      : meta.label;
  const triggerClass = variant === "row" ? rowClass : pillClass;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "row" ? "ghost" : "outline"}
            className={triggerClass}
          />
        }
      >
        <PriorityIcon priority={value} />
        <span className="flex-1 truncate text-left">{label}</span>
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

export function AssigneePill({
  value,
  members,
  onChange,
  variant = "pill",
}: {
  value: string | null;
  members: Member[];
  onChange: (assigneeId: string | null) => void;
  variant?: "pill" | "row";
}) {
  const assignee = members.find((m) => m.id === value) ?? null;
  const triggerClass = variant === "row" ? rowClass : pillClass;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "row" ? "ghost" : "outline"}
            className={triggerClass}
          />
        }
      >
        {assignee ? (
          <UserAvatar name={assignee.name} size="xs" />
        ) : (
          <CircleUser className="size-3.5 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-left">
          {assignee ? assignee.name : variant === "row" ? "Unassigned" : "Assignee"}
        </span>
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
              <UserAvatar name={member.name} size="xs" />
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
  variant = "pill",
}: {
  value: string | null;
  onChange: (dueDate: string | null) => void;
  variant?: "pill" | "row";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = value ? formatDueDate(value) : variant === "row" ? "No due date" : "ETA";
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

  if (variant === "row") {
    return (
      <span
        className={cn(
          "relative inline-flex h-8 w-full items-center gap-2 rounded-md px-2 text-[14px] transition-colors hover:bg-white/[0.04]",
          value && !overdue && "text-foreground",
          !value && "text-muted-foreground",
          overdue && "text-red-400",
        )}
      >
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none"
        >
          <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </button>
        {value && (
          <button
            type="button"
            aria-label="Clear due date"
            onClick={() => onChange(null)}
            className="rounded-sm p-0.5 text-muted-foreground/70 hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
        <input
          ref={inputRef}
          type="date"
          aria-label="Set due date"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-2 size-0 opacity-0"
        />
      </span>
    );
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

export function StatusRow(
  props: Omit<React.ComponentProps<typeof StatusPill>, "variant">,
) {
  return <StatusPill {...props} variant="row" />;
}

export function PriorityRow(
  props: Omit<React.ComponentProps<typeof PriorityPill>, "variant">,
) {
  return <PriorityPill {...props} variant="row" />;
}

export function AssigneeRow(
  props: Omit<React.ComponentProps<typeof AssigneePill>, "variant">,
) {
  return <AssigneePill {...props} variant="row" />;
}

export function DueDateRow(
  props: Omit<React.ComponentProps<typeof DueDatePill>, "variant">,
) {
  return <DueDatePill {...props} variant="row" />;
}

export type ProjectOption = {
  id: string;
  name: string;
};

export function ProjectPill({
  value,
  projects,
  onChange,
  variant = "pill",
}: {
  value: string | null;
  projects: ProjectOption[];
  onChange: (projectId: string | null) => void;
  variant?: "pill" | "row";
}) {
  const project = projects.find((item) => item.id === value) ?? null;
  const triggerClass = variant === "row" ? rowClass : pillClass;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "row" ? "ghost" : "outline"}
            className={triggerClass}
          />
        }
      >
        <FolderKanban className="size-3.5 text-muted-foreground" />
        <span className="flex-1 truncate text-left">
          {project
            ? project.name
            : variant === "row"
              ? "No project"
              : "Project"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Set project…
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onChange(null)}>
            <FolderKanban className="size-3.5 text-muted-foreground" />
            <span className="flex-1">No project</span>
            {!value && <Check className="size-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
          {projects.length === 0 ? (
            <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
          ) : (
            projects.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onChange(item.id)}
              >
                <FolderKanban className="size-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{item.name}</span>
                {value === item.id && (
                  <Check className="size-3.5 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectRow(
  props: Omit<React.ComponentProps<typeof ProjectPill>, "variant">,
) {
  return <ProjectPill {...props} variant="row" />;
}
