"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, FolderKanban, ListFilter } from "lucide-react";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { TagBadge } from "@/components/tasks/tag-badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UnassignedAvatar, UserAvatar } from "@/components/user-avatar";
import type { Member } from "@/hooks/use-members";
import { fetchProjects, fetchTags } from "@/lib/api";
import { PRIORITIES } from "@/lib/constants";
import {
  PROJECTS_STALE_MS,
  queryKeys,
  TAGS_STALE_MS,
} from "@/lib/query-keys";
import {
  NO_PROJECT_ID,
  UNASSIGNED_ASSIGNEE_ID,
  type ViewFilters,
} from "@/lib/task-filters";
import { cn } from "@/lib/utils";

type IssueFiltersMenuProps = {
  members: Member[];
  filters: ViewFilters;
  isFiltering: boolean;
  onSelectAssignee: (id: string) => void;
  onClearAssignee: () => void;
  onSelectProject: (id: string) => void;
  onClearProject: () => void;
  onTogglePriority: (priority: ViewFilters["priorities"][number]) => void;
  onClearPriorities: () => void;
  onToggleTag: (tagId: string) => void;
  onClearTags: () => void;
  onClearAll: () => void;
};

export function IssueFiltersMenu({
  members,
  filters,
  isFiltering,
  onSelectAssignee,
  onClearAssignee,
  onSelectProject,
  onClearProject,
  onTogglePriority,
  onClearPriorities,
  onToggleTag,
  onClearTags,
  onClearAll,
}: IssueFiltersMenuProps) {
  const [open, setOpen] = useState(false);
  const tagsQuery = useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags,
    enabled: open,
    staleTime: TAGS_STALE_MS,
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    enabled: open,
    staleTime: PROJECTS_STALE_MS,
  });
  const tags = tagsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  const sortedMembers = [...members].sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Filter"
            title="Filter"
            className={cn(
              "size-7 shrink-0 px-0",
              isFiltering
                ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200"
                : "text-muted-foreground/70 hover:bg-white/[0.05] hover:text-foreground/80",
            )}
          />
        }
      >
        <ListFilter className="size-3.5" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-1">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Filters</p>
          {isFiltering && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="border-t border-border/40 px-1 py-1">
          <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground/70">
            Assignee
          </p>
          <button
            type="button"
            onClick={onClearAssignee}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
          >
            <span className="flex-1 text-left">All assignees</span>
            {!filters.assigneeId && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectAssignee(UNASSIGNED_ASSIGNEE_ID)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
          >
            <UnassignedAvatar size="xs" />
            <span className="flex-1 text-left">Unassigned</span>
            {filters.assigneeId === UNASSIGNED_ASSIGNEE_ID && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>
          {sortedMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectAssignee(member.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
            >
              <UserAvatar name={member.name} size="xs" />
              <span className="flex-1 truncate text-left">
                {member.name}
                {member.isCurrentUser && (
                  <span className="text-muted-foreground"> (you)</span>
                )}
              </span>
              {filters.assigneeId === member.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        {projects.length > 0 && (
        <div className="border-t border-border/40 px-1 py-1">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              Project
            </p>
            {filters.projectId && (
              <button
                type="button"
                onClick={onClearProject}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClearProject}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
          >
            <span className="flex-1 text-left">All projects</span>
            {!filters.projectId && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectProject(NO_PROJECT_ID)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
          >
            <FolderKanban className="size-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">No project</span>
            {filters.projectId === NO_PROJECT_ID && (
              <Check className="size-3.5 text-muted-foreground" />
            )}
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
            >
              <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-left">{project.name}</span>
              {filters.projectId === project.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
        )}

        <div className="border-t border-border/40 px-1 py-1">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              Priority
            </p>
            {filters.priorities.length > 0 && (
              <button
                type="button"
                onClick={onClearPriorities}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {PRIORITIES.map((priority) => {
            const active = filters.priorities.includes(priority.id);
            return (
              <button
                key={priority.id}
                type="button"
                onClick={() => onTogglePriority(priority.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
              >
                <PriorityIcon priority={priority.id} />
                <span className="flex-1 text-left">{priority.label}</span>
                {active && <Check className="size-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>

        {tags.length > 0 && (
        <div className="border-t border-border/40 px-1 py-1">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              Label
            </p>
            {filters.tagIds.length > 0 && (
              <button
                type="button"
                onClick={onClearTags}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {tags.map((tag) => {
            const active = filters.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-white/[0.05]"
              >
                <TagBadge tag={tag} />
                <span className="flex-1" />
                {active && (
                  <Check className="size-3.5 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
