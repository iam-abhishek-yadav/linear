"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  List,
  PenSquare,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { useSession } from "@/components/session-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTasks } from "@/hooks/use-tasks";
import type { TaskInput } from "@/hooks/use-tasks";
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
  const { createTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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

    function onToggle() {
      setOpen((current) => !current);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("command-palette:toggle", onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("command-palette:toggle", onToggle);
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

  async function handleCreate(data: TaskInput) {
    const task = await createTask(data);
    setCreateOpen(false);
    router.push(`/issues/${task.id}`);
  }

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem
              value="create new issue"
              onSelect={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
            >
              <PenSquare />
              <span>Create new issue</span>
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

      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus="TODO"
        onSave={handleCreate}
      />
    </>
  );
}
