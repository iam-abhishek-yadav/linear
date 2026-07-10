import type { TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

type PriorityIconProps = {
  priority: TaskPriority;
  className?: string;
};

const BARS = [
  { x: 2.5, height: 4 },
  { x: 6.5, height: 6.5 },
  { x: 10.5, height: 9 },
] as const;

function NoPriorityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-3.5 text-muted-foreground/70", className)}
      aria-hidden
    >
      <path
        d="M3 5.5h10M3 8h10M3 10.5h10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function PriorityBarsIcon({
  activeCount,
  className,
}: {
  activeCount: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-3.5 text-foreground/85", className)}
      aria-hidden
    >
      {BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={13 - bar.height}
          width={2}
          height={bar.height}
          rx={0.75}
          fill="currentColor"
          opacity={index < activeCount ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}

function getActiveBarCount(priority: TaskPriority): 1 | 2 | 3 | null {
  switch (priority) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 2;
    case "HIGH":
      return 3;
    default:
      return null;
  }
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  if (priority === "NONE") {
    return <NoPriorityIcon className={className} />;
  }

  if (priority === "URGENT") {
    return <UrgentIcon className={className} />;
  }

  const activeCount = getActiveBarCount(priority);
  if (!activeCount) return null;

  return <PriorityBarsIcon activeCount={activeCount} className={className} />;
}
