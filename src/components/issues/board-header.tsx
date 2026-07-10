"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid, List, Plus } from "lucide-react";
import { AssigneeFilter } from "@/components/issues/assignee-filter";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import type { Member } from "@/hooks/use-members";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type BoardPageChromeProps = {
  onNewIssue?: () => void;
  members?: Member[];
  selectedAssigneeId?: string | null;
  onSelectAssignee?: (id: string) => void;
  onClearAssigneeFilter?: () => void;
};

export function BoardPageChrome({
  onNewIssue,
  members = [],
  selectedAssigneeId = null,
  onSelectAssignee,
  onClearAssigneeFilter,
}: BoardPageChromeProps) {
  const { organization } = useSession();

  return (
    <header className="shrink-0">
      <div className="flex h-12 items-center gap-2 px-3 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain scrollbar-none">
          <div className="flex shrink-0 items-center gap-1.5 text-[13px]">
            <SidebarTrigger />
            <span
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold text-white",
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

          {onSelectAssignee &&
            onClearAssigneeFilter &&
            members.length > 0 && (
              <AssigneeFilter
                members={members}
                selectedId={selectedAssigneeId}
                onSelect={onSelectAssignee}
                onClear={onClearAssigneeFilter}
              />
            )}
        </div>
        {onNewIssue && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 gap-1.5 px-2 text-[13px] text-muted-foreground hover:bg-white/[0.06] sm:px-3"
            onClick={onNewIssue}
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New issue</span>
          </Button>
        )}
      </div>
    </header>
  );
}
