"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  formatActivityMessage,
  formatActivityTime,
} from "@/lib/task-activity-format";
import type { TaskActivityType, TaskStatus } from "@/lib/types";

export type TaskActivityItem = {
  id: string;
  type: TaskActivityType;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  createdAt: string;
  user: { id: string; name: string };
};

type TaskActivityFeedProps = {
  taskId: string;
  refreshKey?: number;
};

export function TaskActivityFeed({ taskId, refreshKey = 0 }: TaskActivityFeedProps) {
  const [activities, setActivities] = useState<TaskActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    const response = await fetch(`/api/tasks/${taskId}/activity`);
    if (!response.ok) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const data = await response.json();
    setActivities(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    setLoading(true);
    loadActivities();
  }, [loadActivities, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-3 text-sm">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground/90">
              {formatActivityMessage(activity)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatActivityTime(activity.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
