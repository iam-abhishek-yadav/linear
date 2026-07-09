"use client";

import Link from "next/link";
import { PenSquare, Search } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export function WorkspaceMenu() {
  const { organization } = useSession();
  const initials = getInitials(organization.name);
  const avatarColor = getAvatarColor(organization.name);

  return (
    <div className="flex items-center gap-1 px-2 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
            avatarColor,
          )}
        >
          {initials}
        </span>
        <span className="truncate text-[13px] font-medium">{organization.name}</span>
      </div>
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
