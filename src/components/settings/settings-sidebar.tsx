"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Download,
  KeyRound,
  Puzzle,
  Shield,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/settings/teams", label: "Teams", icon: UsersRound, disabled: true },
  { href: "/settings/members", label: "Members", icon: Users },
  { href: "/settings/security", label: "Security", icon: Shield, disabled: true },
  { href: "/settings/api", label: "API", icon: KeyRound, disabled: true },
  { href: "/settings/applications", label: "Applications", icon: Puzzle, disabled: true },
  { href: "/settings/billing", label: "Billing", icon: CreditCard, disabled: true },
  { href: "/settings/import-export", label: "Import / Export", icon: Download, disabled: true },
];

function SettingsNavLink({
  href,
  label,
  icon: Icon,
  active,
  disabled,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground/40">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </span>
    );
  }

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

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-black">
      <div className="px-2 py-2.5">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to app
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-muted-foreground/60">
          Administration
        </p>
        {adminNav.map((item) => (
          <SettingsNavLink
            key={item.href}
            {...item}
            active={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}
