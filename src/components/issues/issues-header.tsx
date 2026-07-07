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

const VIEW_TABS = [
  { href: "/list", label: "All issues" },
  { href: "/active", label: "Active" },
  { href: "/backlog", label: "Backlog" },
] as const;

export function IssuesPageChrome() {
  const pathname = usePathname();
  const { organization } = useSession();

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
          <span className="text-muted-foreground/75">Issues</span>
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
          {VIEW_TABS.map((tab) => {
            const isActive = pathname === tab.href;
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
