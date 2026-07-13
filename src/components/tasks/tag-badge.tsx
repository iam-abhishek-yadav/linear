import type { TaskTagSummary } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagBadge({
  tag,
  className,
}: {
  tag: TaskTagSummary;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
        className,
      )}
      style={{
        backgroundColor: `${tag.color}22`,
        color: tag.color,
        border: `1px solid ${tag.color}44`,
      }}
      title={tag.name}
    >
      <span className="truncate">{tag.name}</span>
    </span>
  );
}

export function TagList({
  tags,
  className,
  limit,
}: {
  tags: TaskTagSummary[];
  className?: string;
  limit?: number;
}) {
  if (tags.length === 0) {
    return null;
  }

  const visible = limit ? tags.slice(0, limit) : tags;
  const hiddenCount = limit ? Math.max(0, tags.length - limit) : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((tag) => (
        <TagBadge key={tag.id} tag={tag} />
      ))}
      {hiddenCount > 0 && (
        <span className="text-[11px] text-muted-foreground">+{hiddenCount}</span>
      )}
    </div>
  );
}
