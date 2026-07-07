import type { NotificationType, TaskStatus } from "@/lib/types";

export type NotificationActor = {
  id: string;
  name: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: NotificationActor | null;
  task: { id: string; title: string; status: TaskStatus };
};

export function getActorDisplayName(actor: NotificationActor | null) {
  return actor?.name ?? "Someone";
}

export function formatNotificationMessage(
  type: NotificationType,
  actor: NotificationActor | null,
) {
  const name = getActorDisplayName(actor);
  switch (type) {
    case "ASSIGNED":
      return `${name} assigned this issue to you`;
    default:
      return `${name} updated this issue`;
  }
}
