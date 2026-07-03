"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WORKSPACE_NAME = "Mini Linear";

type BoardPageChromeProps = {
  onNewIssue?: () => void;
};

export function BoardPageChrome({ onNewIssue }: BoardPageChromeProps) {
  return (
    <header className="shrink-0">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="flex size-[18px] items-center justify-center rounded-[4px] bg-emerald-600/90 text-[8px] font-bold text-white">
            ML
          </span>
          <span className="text-foreground/80">{WORKSPACE_NAME}</span>
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
      <div className="flex h-10 items-center gap-1 border-b border-white/[0.06] px-4">
        <span className="flex items-center gap-1.5 rounded-md bg-white/[0.08] px-2.5 py-1 text-[13px] text-foreground">
          <LayoutGrid className="size-3.5" />
          Board
        </span>
        <Link
          href="/list"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] text-muted-foreground hover:text-foreground/80",
          )}
        >
          <List className="size-3.5" />
          Issues
        </Link>
      </div>
    </header>
  );
}
