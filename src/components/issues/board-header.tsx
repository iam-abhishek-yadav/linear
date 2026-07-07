"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid, List, Plus } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type BoardPageChromeProps = {
  onNewIssue?: () => void;
};

export function BoardPageChrome({ onNewIssue }: BoardPageChromeProps) {
  const { organization } = useSession();

  return (
    <header className="shrink-0">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-1.5 text-[13px]">
          <SidebarTrigger />
          <span
            className={cn(
              "flex size-[18px] items-center justify-center rounded-[4px] text-[8px] font-bold text-white",
              getAvatarColor(organization.name),
            )}
          >
            {getInitials(organization.name)}
          </span>
          <span className="text-foreground/80">{organization.name}</span>
          <ChevronRight className="size-3 text-muted-foreground/40" />
          <span className="text-muted-foreground">Board</span>
        </div>
        {onNewIssue && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-[13px] text-muted-foreground hover:bg-white/[0.06]"
            onClick={onNewIssue}
          >
            <Plus className="size-3.5" />
            New issue
          </Button>
        )}
      </div>
    </header>
  );
}
