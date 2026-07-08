"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ChevronRight, Inbox, Loader2 } from "lucide-react";
import {
  useNotifications,
  type NotificationItem,
} from "@/components/notifications-provider";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { StatusIcon } from "@/components/tasks/status-icon";
import { useTasks } from "@/hooks/use-tasks";
import {
  formatNotificationMessage,
  getActorDisplayName,
} from "@/lib/notification-types";
import { formatTaskIdentifier, getProjectKey } from "@/lib/task-utils";
import { formatRelativeDate, getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

function NotificationRow({
  notification,
  identifier,
  onOpen,
}: {
  notification: NotificationItem;
  identifier: string | null;
  onOpen: () => void;
}) {
  const actorName = getActorDisplayName(notification.actor);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full items-center gap-3 border-b border-white/[0.05] px-5 py-3 text-left transition-colors",
        notification.read
          ? "hover:bg-white/[0.02]"
          : "bg-white/[0.015] hover:bg-white/[0.04]",
      )}
    >
      <span className="flex w-2 shrink-0 justify-center">
        {!notification.read && (
          <span className="size-2 rounded-full bg-violet-500" />
        )}
      </span>

      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
          getAvatarColor(actorName),
        )}
      >
        {getInitials(actorName)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusIcon status={notification.task.status} />
          {identifier && (
            <span className="shrink-0 font-mono text-[11px] tracking-tight text-white/35">
              {identifier}
            </span>
          )}
          <span
            className={cn(
              "truncate text-[13px]",
              notification.read
                ? "text-foreground/80"
                : "font-medium text-foreground",
            )}
          >
            {notification.task.title}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatNotificationMessage(notification.type, notification.actor)}
        </p>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-muted-foreground/60">
        {formatRelativeDate(new Date(notification.createdAt))}
      </span>
    </button>
  );
}

export function InboxView() {
  const router = useRouter();
  const { organization } = useSession();
  const { notifications, loading, unreadCount, markRead, markAllRead } =
    useNotifications();
  const { tasks } = useTasks();

  const projectKey = getProjectKey(organization.name);

  const taskIdentifiers = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      map.set(task.id, formatTaskIdentifier(task, tasks, projectKey));
    }
    return map;
  }, [tasks, projectKey]);

  function openNotification(notification: NotificationItem) {
    if (!notification.read) markRead(notification.id);
    router.push(`/issues/${notification.task.id}`);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
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
            <span className="text-muted-foreground/75">Inbox</span>
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[11px] font-medium text-violet-300">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted-foreground/70 transition-colors hover:bg-white/[0.05] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </button>
        </div>
        <div className="h-px border-b border-white/[0.06]" />
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground/40">
              <Inbox className="size-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/80">
                No notifications
              </p>
              <p className="text-[13px] text-muted-foreground">
                You&apos;re all caught up. Assignments, comments, and status
                updates will show up here.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                identifier={taskIdentifiers.get(notification.task.id) ?? null}
                onOpen={() => openNotification(notification)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
