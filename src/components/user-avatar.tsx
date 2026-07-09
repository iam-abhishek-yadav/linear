import { CircleUser } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "size-4 text-[8px]",
  sm: "size-5 text-[9px]",
  md: "size-6 text-[10px]",
} as const;

type UserAvatarProps = {
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function UserAvatar({ name, size = "sm", className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        getAvatarColor(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

type UnassignedAvatarProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function UnassignedAvatar({
  size = "sm",
  className,
}: UnassignedAvatarProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-dashed border-white/25 bg-white/[0.03] text-muted-foreground/60",
        sizeClasses[size],
        className,
      )}
    >
      <CircleUser className={size === "xs" ? "size-2.5" : "size-3"} />
    </span>
  );
}
