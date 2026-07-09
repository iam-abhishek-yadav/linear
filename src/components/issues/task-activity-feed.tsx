"use client";

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

export function TaskActivityFeed({
  activities,
}: {
  activities: TaskActivityItem[];
}) {
  if (activities.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">No activity recorded yet.</p>
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
