"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LayoutList,
  PanelRight,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export type IssuesTabScope = "workspace" | "assigned";
export type AssignedView = "all" | "active" | "backlog" | "completed";

type ViewTab = {
  href: string;
  label: string;
  key: string;
};

function getViewTabs(
  scope: IssuesTabScope,
  assignedView: AssignedView,
): ViewTab[] {
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
}: {
  scope?: IssuesTabScope;
  title?: string;
  assignedView?: AssignedView;
}) {
  const pathname = usePathname();
  const { organization } = useSession();
  const tabs = getViewTabs(scope, assignedView);

  return (
    <header className="shrink-0">
      <div className="flex h-11 items-center justify-between px-5">
        <div className="flex items-center gap-1.5 text-[13px]">
          <SidebarTrigger />
          <span
            className={cn(
              "flex size-[18px] items-center justify-center rounded-[5px] text-[9px] font-semibold text-white",
              getAvatarColor(organization.name),
            )}
          >
            {getInitials(organization.name)}
          </span>
          <span className="text-foreground/75">{organization.name}</span>
          <ChevronRight className="size-3 text-muted-foreground/35" />
          <span className="text-muted-foreground/75">{title}</span>
          <button
            type="button"
            className="ml-0.5 rounded p-1 text-muted-foreground/35 hover:bg-white/[0.05] hover:text-muted-foreground"
          >
            <Star className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-foreground/45 hover:bg-white/[0.05] hover:text-muted-foreground"
        >
          <Bell className="size-4" />
        </button>
      </div>

      <div className="flex h-9 items-center justify-between border-b border-white/[0.06] px-5">
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const isActive = isTabActive(scope, tab, pathname, assignedView);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-[6px] px-2.5 py-1 text-[13px] transition-colors",
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

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-[6px] text-muted-foreground/45 hover:bg-white/[0.05] hover:text-muted-foreground"
          >
            <SlidersHorizontal className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-[6px] text-muted-foreground/45 hover:bg-white/[0.05] hover:text-muted-foreground"
          >
            <LayoutList className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-[6px] text-muted-foreground/45 hover:bg-white/[0.05] hover:text-muted-foreground"
          >
            <PanelRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
