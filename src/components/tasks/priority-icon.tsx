import type { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

type PriorityIconProps = {
  priority: TaskPriority;
  className?: string;
};

const BAR_HEIGHTS = ["h-0.5", "h-1", "h-1.5"] as const;

/** Linear-style urgent: rounded square with exclamation */
function UrgentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-3.5", className)}
      aria-hidden
    >
      <rect x="1" y="1" width="14" height="14" rx="3.5" fill="#FC7840" />
      <path
        d="M8 4.25c.4 0 .72.34.7.74l-.25 4.1a.45.45 0 0 1-.9 0l-.25-4.1A.7.7 0 0 1 8 4.25Z"
        fill="#fff"
      />
      <circle cx="8" cy="11.35" r="0.85" fill="#fff" />
    </svg>
  );
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  if (priority === "NONE") {
    return (
      <span
        className={cn(
          "flex items-center justify-center gap-[2px]",
          className,
        )}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-[3px] rounded-full bg-muted-foreground/55"
          />
        ))}
      </span>
    );
  }

  if (priority === "URGENT") {
    return <UrgentIcon className={className} />;
  }

  const count =
    priority === "LOW" ? 1 : priority === "MEDIUM" ? 2 : 3;
  const color =
    priority === "HIGH"
      ? "bg-orange-400"
      : priority === "MEDIUM"
        ? "bg-yellow-400"
        : "bg-blue-400";

  return (
    <span className={cn("flex h-3.5 items-end gap-0.5", className)}>
      {BAR_HEIGHTS.slice(0, count).map((height, i) => (
        <span key={i} className={cn("w-0.5 rounded-full", height, color)} />
      ))}
    </span>
  );
}
