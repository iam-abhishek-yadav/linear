"use client";

import Link from "next/link";
import { IssueDetail } from "@/components/issues/issue-detail";
import { IssueDetailSkeleton } from "@/components/issues/issue-detail-skeleton";
import { useIssueDetail } from "@/hooks/use-issue-detail";

type IssueDetailRouteProps = {
  taskId: string;
};

export function IssueDetailRoute({ taskId }: IssueDetailRouteProps) {
  const { data, loading, error, refetch } = useIssueDetail(taskId);

  if (data) {
    return (
      <IssueDetail
        initialData={data}
        isLoadingTimeline={Boolean(data.partial)}
      />
    );
  }

  if (error === "not_found") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">Issue not found.</p>
        <Link
          href="/list"
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Back to issues
        </Link>
      </div>
    );
  }

  if (error === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load this issue.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm text-foreground underline-offset-4 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <IssueDetailSkeleton />
    </div>
  );
}

export { usePrefetchIssueDetail } from "@/hooks/use-open-issue";
