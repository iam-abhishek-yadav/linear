"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, PenSquare, Search } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export function WorkspaceMenu() {
  const router = useRouter();
  const { organization } = useSession();
  const initials = getInitials(organization.name);
  const avatarColor = getAvatarColor(organization.name);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 px-2 py-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 outline-none",
            "hover:bg-white/[0.04] data-popup-open:bg-white/[0.06]",
          )}
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
              avatarColor,
            )}
          >
            {initials}
          </span>
          <span className="truncate text-[13px] font-medium">{organization.name}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-64 border-border/60 bg-[#1a1a1c] p-1 shadow-xl"
        >
          <DropdownMenuItem
            render={<Link href="/settings/workspace" />}
            className="text-[13px]"
          >
            Settings
            <DropdownMenuShortcut>G then S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/settings/members" />}
            className="text-[13px]"
          >
            Invite and manage members
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="text-[13px] text-muted-foreground" disabled>
            Switch workspace
            <ChevronRight className="ml-auto size-3.5 opacity-50" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-[13px]"
          >
            Log out
            <DropdownMenuShortcut>Alt ⇧ Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
  );
}
