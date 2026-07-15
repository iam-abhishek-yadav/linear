import { SidebarTrigger } from "@/components/sidebar-provider";
import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/6", className)}
    />
  );
}

export function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading activity">
      <ul className="space-y-4">
        {[0, 1, 2].map((index) => (
          <li key={index} className="flex items-start gap-3">
            <Shimmer className="size-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Shimmer className="h-3.5 w-[70%]" />
              {index === 2 && <Shimmer className="h-3.5 w-[45%]" />}
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Shimmer className="min-h-[72px] w-full rounded-lg" />
        <div className="flex justify-end">
          <Shimmer className="h-7 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function IssueDetailSkeleton() {
  return (
    <>
      <header className="shrink-0 border-b border-white/6">
        <div className="flex h-11 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <SidebarTrigger />
            <div className="flex items-center gap-1">
              <Shimmer className="h-3.5 w-16" />
              <Shimmer className="size-3 rounded-sm opacity-40" />
              <Shimmer className="h-3.5 w-12" />
              <Shimmer className="size-3 rounded-sm opacity-40" />
              <Shimmer className="h-3.5 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shimmer className="h-3.5 w-10" />
            <Shimmer className="size-7 rounded-md" />
            <Shimmer className="size-7 rounded-md" />
            <Shimmer className="size-7 rounded-md" />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto scrollbar-hidden">
          <div className="mx-auto max-w-3xl px-8 py-6">
            <Shimmer className="h-9 w-3/4 max-w-xl" />
            <div className="mt-5 space-y-2.5">
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-[92%]" />
              <Shimmer className="h-4 w-4/5" />
              <Shimmer className="h-4 w-2/3" />
            </div>

            <div className="mt-10 border-t border-white/6 pt-6">
              <Shimmer className="mb-4 h-4 w-16" />
              <ActivityTimelineSkeleton />
            </div>
          </div>
        </div>

        <aside className="hidden w-[280px] shrink-0 border-l border-white/6 bg-black/20 px-3 py-4 md:block">
          <div className="rounded-lg border border-white/6 bg-white/2 p-3">
            <Shimmer className="mb-3 h-4 w-20" />
            <div className="space-y-2">
              {["Status", "Priority", "Assignee", "Due date", "Labels"].map(
                (label) => (
                  <div key={label} className="flex items-center gap-2 px-1 py-1">
                    <Shimmer className="h-3 w-[52px]" />
                    <Shimmer className="h-7 flex-1" />
                  </div>
                ),
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
