"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NotificationType, TaskStatus } from "@/lib/types";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string } | null;
  task: { id: string; title: string; status: TaskStatus };
};

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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Optimistic; ignore failure.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {
      // Optimistic; ignore failure.
    }
  }, []);

  const unreadCount = notifications.reduce(
    (count, n) => (n.read ? count : count + 1),
    0,
  );

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
