import { Check, X } from "lucide-react";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusIconProps = {
  status: TaskStatus;
  className?: string;
};

export function StatusIcon({ status, className }: StatusIconProps) {
  const base = cn("size-[14px] shrink-0", className);

  switch (status) {
    case "BACKLOG":
      return (
        <span
          className={cn(
            base,
            "rounded-full border border-dashed border-muted-foreground/50",
          )}
        />
      );
    case "TODO":
      return (
        <span
          className={cn(
            base,
            "rounded-full border-[1.5px] border-foreground/70",
          )}
        />
      );
    case "IN_PROGRESS":
      return (
        <span className={cn(base, "relative rounded-full")}>
          <span className="absolute inset-0 rounded-full border-[1.5px] border-amber-400/80" />
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-y-0 left-0 w-1/2 bg-amber-400" />
          </span>
        </span>
      );
    case "DONE":
      return (
        <span
          className={cn(
            base,
            "flex items-center justify-center rounded-full bg-violet-500",
          )}
        >
          <Check className="size-2 text-white" strokeWidth={3} />
        </span>
      );
    case "CANCELED":
      return (
        <span
          className={cn(
            base,
            "flex items-center justify-center rounded-full bg-muted-foreground/40",
          )}
        >
          <X className="size-2 text-background" strokeWidth={3} />
        </span>
      );
  }
}
