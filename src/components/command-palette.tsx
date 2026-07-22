"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Code2,
  FolderKanban,
  Inbox,
  LayoutGrid,
  List,
  PenSquare,
  Search,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { openCreateIssue } from "@/components/create-issue-dialog";
import { openGlobalSearch } from "@/components/global-search";
import { useSession } from "@/components/session-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { canManageMembers, isAdmin } from "@/lib/roles";

type NavCommand = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") {
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      setOpen((current) => !current);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const navigation = useMemo(() => {
    const items: NavCommand[] = [
      {
        id: "inbox",
        label: "Inbox",
        href: "/inbox",
        icon: Inbox,
        keywords: "notifications",
      },
      {
        id: "my-issues",
        label: "My issues",
        href: "/my-issues",
        icon: User,
        keywords: "assigned me",
      },
      {
        id: "share",
        label: "Share",
        href: "/share",
        icon: Code2,
        keywords: "code file send handoff",
      },
      {
        id: "issues",
        label: "Issues",
        href: "/active",
        icon: List,
        keywords: "list active",
      },
      {
        id: "board",
        label: "Board",
        href: "/board",
        icon: LayoutGrid,
        keywords: "kanban",
      },
      {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
        keywords: "create project members",
      },
      {
        id: "completed",
        label: "Completed",
        href: "/completed",
        icon: CheckCircle2,
        keywords: "done finished",
      },
      {
        id: "profile",
        label: "Profile",
        href: "/settings/profile",
        icon: UserCircle,
        keywords: "account settings",
      },
    ];

    if (isAdmin(user.role)) {
      items.push({
        id: "workspace",
        label: "Workspace settings",
        href: "/settings/workspace",
        icon: Building2,
        keywords: "organization rename delete",
      });
    }

    if (canManageMembers(user.role)) {
      items.push({
        id: "members",
        label: "Members",
        href: "/settings/members",
        icon: Users,
        keywords: "invite team",
      });
    }

    return items;
  }, [user.role]);

  function runNavigation(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="create new issue"
            onSelect={() => {
              setOpen(false);
              window.setTimeout(() => openCreateIssue(), 0);
            }}
          >
            <PenSquare />
            <span>Create new issue</span>
          </CommandItem>
          <CommandItem
            value="search issues global"
            onSelect={() => {
              setOpen(false);
              window.setTimeout(() => openGlobalSearch(), 0);
            }}
          >
            <Search />
            <span>Search issues</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigation.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.keywords ?? ""}`}
              onSelect={() => runNavigation(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
