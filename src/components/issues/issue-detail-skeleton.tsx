import { SidebarTrigger } from "@/components/sidebar-provider";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`}
    />
  );
}

export function IssueDetailSkeleton() {
  return (
    <>
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="flex h-11 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <SidebarTrigger />
            <Shimmer className="h-4 w-48" />
          </div>
          <Shimmer className="h-4 w-20" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-6">
            <Shimmer className="h-9 w-2/3" />
            <div className="mt-4 space-y-2">
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-4 w-3/4" />
            </div>

            <div className="mt-10 border-t border-white/[0.06] pt-6">
              <Shimmer className="mb-4 h-4 w-20" />
              <div className="space-y-4">
                <Shimmer className="h-12 w-full" />
                <Shimmer className="h-12 w-full" />
                <Shimmer className="h-[72px] w-full" />
              </div>
            </div>
          </div>
        </div>

        <aside className="w-[280px] shrink-0 border-l border-white/[0.06] bg-black/20 px-3 py-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <Shimmer className="mb-3 h-4 w-24" />
            <div className="space-y-3">
              <Shimmer className="h-8 w-full" />
              <Shimmer className="h-8 w-full" />
              <Shimmer className="h-8 w-full" />
              <Shimmer className="h-8 w-full" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
