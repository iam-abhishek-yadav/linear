"use client";

import { ChevronRight, Plus } from "lucide-react";
import { IssueFiltersMenu } from "@/components/issues/issue-filters-menu";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import type { Member } from "@/hooks/use-members";
import type { ViewFilters } from "@/lib/task-filters";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type BoardPageChromeProps = {
  onNewIssue?: () => void;
  members?: Member[];
  filters?: ViewFilters;
  isFiltering?: boolean;
  onSelectAssignee?: (id: string) => void;
  onClearAssignee?: () => void;
  onSelectProject?: (id: string) => void;
  onClearProject?: () => void;
  onTogglePriority?: (priority: ViewFilters["priorities"][number]) => void;
  onClearPriorities?: () => void;
  onToggleTag?: (tagId: string) => void;
  onClearTags?: () => void;
  onClearAll?: () => void;
};

export function BoardPageChrome({
  onNewIssue,
  members = [],
  filters,
  isFiltering = false,
  onSelectAssignee,
  onClearAssignee,
  onSelectProject,
  onClearProject,
  onTogglePriority,
  onClearPriorities,
  onToggleTag,
  onClearTags,
  onClearAll,
}: BoardPageChromeProps) {
  const { organization } = useSession();
  const showFilters =
    filters &&
    onSelectAssignee &&
    onClearAssignee &&
    onSelectProject &&
    onClearProject &&
    onTogglePriority &&
    onClearPriorities &&
    onToggleTag &&
    onClearTags &&
    onClearAll;

  return (
    <header className="shrink-0">
      <div className="flex h-12 items-center gap-2 px-3 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain scrollbar-none">
          <div className="flex shrink-0 items-center gap-1.5 text-[14px]">
            <SidebarTrigger />
            <span
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white",
                getAvatarColor(organization.name),
              )}
            >
              {getInitials(organization.name)}
            </span>
            <span className="hidden truncate text-foreground/80 sm:inline">
              {organization.name}
            </span>
            <ChevronRight className="hidden size-3 shrink-0 text-muted-foreground/40 sm:block" />
            <span className="shrink-0 text-muted-foreground">Board</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {showFilters && (
            <IssueFiltersMenu
              members={members}
              filters={filters}
              isFiltering={isFiltering}
              onSelectAssignee={onSelectAssignee}
              onClearAssignee={onClearAssignee}
              onSelectProject={onSelectProject}
              onClearProject={onClearProject}
              onTogglePriority={onTogglePriority}
              onClearPriorities={onClearPriorities}
              onToggleTag={onToggleTag}
              onClearTags={onClearTags}
              onClearAll={onClearAll}
            />
          )}
          {onNewIssue && (
            <Button
              size="sm"
              variant="ghost"
              className="size-7 shrink-0 px-0 text-muted-foreground hover:bg-white/[0.06]"
              onClick={onNewIssue}
              aria-label="New issue"
              title="New issue"
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
