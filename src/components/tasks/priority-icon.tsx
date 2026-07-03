import type { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

type PriorityIconProps = {
  priority: TaskPriority;
  className?: string;
};

const BAR_HEIGHTS = ["h-0.5", "h-1", "h-1.5"] as const;

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  if (priority === "NONE") {
    return (
      <span className={cn("flex items-center gap-0.5", className)}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-px w-1.5 rounded-full bg-muted-foreground/50"
          />
        ))}
      </span>
    );
  }

  const count =
    priority === "LOW" ? 1 : priority === "MEDIUM" ? 2 : 3;
  const color =
    priority === "URGENT"
      ? "bg-red-400"
      : priority === "HIGH"
        ? "bg-orange-400"
        : priority === "MEDIUM"
          ? "bg-yellow-400"
          : "bg-blue-400";

  return (
    <span className={cn("flex items-end gap-0.5", className)}>
      {BAR_HEIGHTS.slice(0, count).map((height, i) => (
        <span key={i} className={cn("w-0.5 rounded-full", height, color)} />
      ))}
    </span>
  );
}
