"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatActivityAction } from "@/lib/task-activity-format";
import { formatRelativeDate, getAvatarColor, getInitials } from "@/lib/user-utils";
import type { TaskActivityType, TaskPriority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TaskActivityItem = {
  id: string;
  type: TaskActivityType;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  fromPriority: TaskPriority | null;
  toPriority: TaskPriority | null;
  fromDueDate: string | null;
  toDueDate: string | null;
  fromAssignee: { id: string; name: string } | null;
  toAssignee: { id: string; name: string } | null;
  createdAt: string;
  user: { id: string; name: string };
};

type TaskActivityFeedProps = {
  taskId: string;
  refreshKey?: number;
};

function ActivityAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

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
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-4 py-2">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-3">
          <ActivityAvatar name={activity.user.name} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] leading-relaxed text-foreground/90">
              <span className="font-medium text-foreground">
                {activity.user.name}
              </span>{" "}
              {formatActivityAction(activity)}
              <span className="text-muted-foreground">
                {" "}
                · {formatRelativeDate(new Date(activity.createdAt))}
              </span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
