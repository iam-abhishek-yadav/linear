"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import type { NotificationItem } from "@/lib/notification-types";
import { NOTIFICATIONS_POLL_MS, queryKeys } from "@/lib/query-keys";

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

function markNotificationsRead(
  notifications: NotificationItem[],
  id?: string,
) {
  return notifications.map((notification) =>
    !id || notification.id === id
      ? { ...notification, read: true }
      : notification,
  );
}

export function NotificationsProvider({
  initialNotifications,
  children,
}: {
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
    initialData: initialNotifications,
    refetchInterval: NOTIFICATIONS_POLL_MS,
  });

  const notifications = notificationsQuery.data ?? [];

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationItem[]>(
        queryKeys.notifications,
      );
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications,
        (current = []) => markNotificationsRead(current, id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationItem[]>(
        queryKeys.notifications,
      );
      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications,
        (current = []) => markNotificationsRead(current),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      loading: notificationsQuery.isPending,
      unreadCount: notifications.filter((notification) => !notification.read)
        .length,
      refresh,
      markRead: (id) => markReadMutation.mutateAsync(id),
      markAllRead: () => markAllReadMutation.mutateAsync(),
    }),
    [
      notifications,
      notificationsQuery.isPending,
      refresh,
      markReadMutation,
      markAllReadMutation,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
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
