"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutGrid,
  List,
  MoreHorizontal,
  User,
} from "lucide-react";
import { useNotifications } from "@/components/notifications-provider";
import { WorkspaceMenu } from "@/components/workspace-menu";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: number;
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
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] rounded-full bg-violet-500/20 px-1.5 text-center text-[11px] font-medium text-violet-300">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
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
  const { unreadCount } = useNotifications();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-black">
      <WorkspaceMenu />

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        <NavLink
          href="/inbox"
          icon={Inbox}
          label="Inbox"
          active={pathname === "/inbox"}
          badge={unreadCount}
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
      </nav>
    </aside>
  );
}
