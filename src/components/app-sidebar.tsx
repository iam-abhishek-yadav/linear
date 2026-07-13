"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Inbox,
  LayoutGrid,
  List,
  LogOut,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { useNotifications } from "@/components/notifications-provider";
import { useSession } from "@/components/session-provider";
import { WorkspaceMenu } from "@/components/workspace-menu";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

const accountNav = [
  { href: "/settings/profile", label: "Profile", icon: UserCircle },
];

const adminNav = [
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/settings/members", label: "Members", icon: Users },
];

const roleLabels = {
  ADMIN: "Admin",
  MEMBER: "Member",
} as const;

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
        "flex items-center gap-2 rounded-md px-2 py-1 text-[14px] transition-colors",
        active
          ? "bg-white/8 font-medium text-foreground"
          : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] rounded-full bg-violet-500/20 px-1.5 text-center text-[12px] font-medium text-violet-300">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-4 text-[12px] font-medium text-muted-foreground/60 first:pt-0">
      {children}
    </p>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { user } = useSession();
  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

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
          href="/my-issues"
          icon={User}
          label="My issues"
          active={pathname === "/my-issues"}
        />

        <SectionLabel>Workspace</SectionLabel>
        <NavLink
          href="/active"
          icon={List}
          label="Issues"
          active={
            pathname === "/active" ||
            pathname === "/list" ||
            pathname === "/backlog"
          }
        />
        <NavLink
          href="/board"
          icon={LayoutGrid}
          label="Board"
          active={pathname === "/board"}
        />
      </nav>

      <div className="border-t border-white/6 px-2 py-3">
        <SectionLabel>Account</SectionLabel>
        <div className="space-y-0">
          {accountNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </div>

        {user.role === "ADMIN" && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <div className="space-y-0">
              {adminNav.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-3 flex items-center gap-2 border-t border-white/6 px-1 pt-3">
          <Link
            href="/settings/profile"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-white/4"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white",
                avatarColor,
              )}
            >
              {initials}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 leading-none">
              <p className="truncate text-[14px] font-medium text-foreground">
                {user.name}
              </p>
              <p className="truncate text-[12px] text-muted-foreground/70">
                {roleLabels[user.role]}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-white/4 hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
