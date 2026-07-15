"use client";

import { useEffect } from "react";
import type { NotificationItem } from "@/lib/notification-types";
import { useNotificationsStore } from "@/stores/notifications-store";

export type { NotificationItem };

export function NotificationsProvider({
  initialNotifications,
  children,
}: {
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const hydrate = useNotificationsStore((state) => state.hydrate);
  const startPolling = useNotificationsStore((state) => state.startPolling);
  const stopPolling = useNotificationsStore((state) => state.stopPolling);

  hydrate(initialNotifications);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return children;
}

export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const loading = useNotificationsStore((state) => state.loading);
  const refresh = useNotificationsStore((state) => state.refresh);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);

  return {
    notifications,
    loading,
    unreadCount: notifications.filter((notification) => !notification.read)
      .length,
    refresh,
    markRead,
    markAllRead,
  };
}
