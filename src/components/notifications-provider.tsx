"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NotificationItem } from "@/lib/notification-types";

export type { NotificationItem };

type NotificationsContextValue = {
  notifications: NotificationItem[];
  loading: boolean;
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const POLL_INTERVAL_MS = 30_000;

function markNotificationsRead(
  notifications: NotificationItem[],
  id?: string,
) {
  return notifications.map((n) =>
    !id || n.id === id ? { ...n, read: true } : n,
  );
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as NotificationItem[];
      setNotifications(data);
    } catch {
      // Ignore transient fetch failures; the next poll will retry.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => markNotificationsRead(prev, id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Optimistic; ignore failure.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => markNotificationsRead(prev));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // Optimistic; ignore failure.
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        unreadCount,
        refresh,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
}
