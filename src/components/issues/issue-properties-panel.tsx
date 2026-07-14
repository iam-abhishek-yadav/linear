"use client";

import { ChevronDown } from "lucide-react";
import {
  AssigneeRow,
  DueDateRow,
  PriorityRow,
  StatusRow,
} from "@/components/tasks/property-pills";
import { LabelsRow } from "@/components/tasks/labels-row";
import type { Member } from "@/hooks/use-members";
import type { TaskTagSummary } from "@/lib/tags";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function PanelSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[14px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-3.5 text-muted-foreground/60 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-0.5 border-t border-white/[0.06] px-2 py-2">
        {children}
      </div>
    </details>
  );
}

function PropertyLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-[72px] shrink-0 text-xs text-muted-foreground/70">
      {children}
    </span>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-1 py-0.5">
      <PropertyLabel>{label}</PropertyLabel>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type IssuePropertiesPanelProps = {
  status: Task["status"];
  priority: Task["priority"];
  assigneeId: string | null;
  dueDate: string | null;
  tags: TaskTagSummary[];
  members: Member[];
  onStatusChange: (status: Task["status"]) => void;
  onPriorityChange: (priority: Task["priority"]) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onDueDateChange: (dueDate: string | null) => void;
  onTagsChange: (tags: TaskTagSummary[]) => void | Promise<void>;
  className?: string;
};

export function IssuePropertiesPanel({
  status,
  priority,
  assigneeId,
  dueDate,
  tags,
  members,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
  onTagsChange,
  className,
}: IssuePropertiesPanelProps) {
  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 overflow-y-auto scrollbar-hidden border-l border-white/[0.06] bg-black/20 px-3 py-4",
        className,
      )}
    >
      <PanelSection title="Properties">
        <PropertyRow label="Status">
          <StatusRow value={status} onChange={onStatusChange} />
        </PropertyRow>
        <PropertyRow label="Priority">
          <PriorityRow value={priority} onChange={onPriorityChange} />
        </PropertyRow>
        <PropertyRow label="Assignee">
          <AssigneeRow
            value={assigneeId}
            members={members}
            onChange={onAssigneeChange}
          />
        </PropertyRow>
        <PropertyRow label="Due date">
          <DueDateRow value={dueDate} onChange={onDueDateChange} />
        </PropertyRow>
        <PropertyRow label="Labels">
          <LabelsRow value={tags} onChange={onTagsChange} />
        </PropertyRow>
      </PanelSection>
    </aside>
  );
}
