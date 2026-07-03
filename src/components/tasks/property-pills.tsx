"use client";

import { Check } from "lucide-react";
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
import { COLUMNS, getPriorityMeta, getStatusMeta, PRIORITIES } from "@/lib/constants";
import type { TaskPriority, TaskStatus } from "@/lib/types";
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
