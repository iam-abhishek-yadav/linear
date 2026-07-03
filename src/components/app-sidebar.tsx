"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Inbox,
  LayoutGrid,
  List,
  MoreHorizontal,
  PenSquare,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROJECT_KEY } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

const WORKSPACE_NAME = "Mini Linear";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors",
        active
          ? "bg-white/[0.08] font-medium text-foreground"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-4 text-[11px] font-medium text-muted-foreground/60">
      {children}
    </p>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-black">
      <div className="flex items-center gap-1 px-2 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/[0.04]"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-red-600 text-[9px] font-bold text-white">
            {PROJECT_KEY.toLowerCase()}
          </span>
          <span className="truncate text-[13px] font-medium">{WORKSPACE_NAME}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/60" />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 shrink-0 text-muted-foreground/60"
        >
          <Search className="size-3.5" />
        </Button>
        <Link
          href="/list"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-white/[0.04] hover:text-foreground"
        >
          <PenSquare className="size-3.5" />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        <NavLink
          href="/list"
          icon={Inbox}
          label="Inbox"
          active={pathname === "/list"}
        />
        <NavLink
          href="/active"
          icon={User}
          label="My issues"
          active={pathname === "/active"}
        />

        <SectionLabel>Workspace</SectionLabel>
        <NavLink
          href="/board"
          icon={LayoutGrid}
          label="Board"
          active={pathname === "/board"}
        />
        <NavLink
          href="/backlog"
          icon={List}
          label="Backlog"
          active={pathname === "/backlog"}
        />
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          <List className="size-3.5 opacity-70" />
          Views
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          <MoreHorizontal className="size-3.5 opacity-70" />
          More
        </button>
      </nav>

      <div className="space-y-0.5 px-2 py-3">
        <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground/60">
          Try
        </p>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          Import issues
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          + Invite people
        </button>
      </div>
    </aside>
  );
}
