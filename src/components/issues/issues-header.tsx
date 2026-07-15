"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { IssueFiltersMenu } from "@/components/issues/issue-filters-menu";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import type { Member } from "@/hooks/use-members";
import type { ViewFilters } from "@/lib/task-filters";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export type IssuesTabScope = "workspace" | "assigned";
export type AssignedView = "all" | "active" | "backlog" | "completed";

type ViewTab = {
  href: string;
  label: string;
  key: string;
};

function getViewTabs(scope: IssuesTabScope): ViewTab[] {
  if (scope === "assigned") {
    return [
      { href: "/my-issues", label: "All issues", key: "all" },
      { href: "/my-issues?view=active", label: "Active", key: "active" },
      { href: "/my-issues?view=backlog", label: "Backlog", key: "backlog" },
      { href: "/my-issues?view=completed", label: "Completed", key: "completed" },
    ];
  }

  return [
    { href: "/list", label: "All issues", key: "all" },
    { href: "/active", label: "Active", key: "active" },
    { href: "/backlog", label: "Backlog", key: "backlog" },
    { href: "/completed", label: "Completed", key: "completed" },
  ];
}

function isTabActive(
  scope: IssuesTabScope,
  tab: ViewTab,
  pathname: string,
  assignedView: AssignedView,
) {
  if (scope === "assigned") {
    return tab.key === assignedView;
  }
  if (tab.key === "completed") {
    return pathname === "/completed";
  }
  return pathname === tab.href;
}

export function IssuesPageChrome({
  scope = "workspace",
  title = "Issues",
  assignedView = "all",
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
}: {
  scope?: IssuesTabScope;
  title?: string;
  assignedView?: AssignedView;
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
}) {
  const pathname = usePathname();
  const { organization } = useSession();
  const tabs = getViewTabs(scope);
  const showFilters =
    scope !== "assigned" &&
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
      <div className="flex h-11 items-center justify-between gap-2 px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-1.5 text-[14px]">
          <SidebarTrigger />
          <span
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white",
              getAvatarColor(organization.name),
            )}
          >
            {getInitials(organization.name)}
          </span>
          <span className="hidden truncate text-foreground/75 sm:inline">
            {organization.name}
          </span>
          <ChevronRight className="hidden size-3 shrink-0 text-muted-foreground/35 sm:block" />
          <span className="truncate text-muted-foreground/75">{title}</span>
        </div>
      </div>

      <div className="flex h-9 items-center justify-between gap-2 border-b border-white/[0.06] px-3 md:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none">
          {tabs.map((tab) => {
            const isActive = isTabActive(scope, tab, pathname, assignedView);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "shrink-0 rounded-[6px] px-2.5 py-1 text-[14px] whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-white/[0.07] text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground/80",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

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
      </div>
    </header>
  );
}
