"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { seedIssueDetailFromTasksCache } from "@/lib/issue-detail-prefill";
import { usePrefetchIssueDetail } from "@/hooks/use-open-issue";

type IssueDetailLinkProps = {
  taskId: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function IssueDetailLink({
  taskId,
  className,
  children,
  onClick,
}: IssueDetailLinkProps) {
  const queryClient = useQueryClient();
  const prefetchIssueDetail = usePrefetchIssueDetail();

  function handleClick() {
    seedIssueDetailFromTasksCache(queryClient, taskId);
    onClick?.();
  }

  return (
    <Link
      href={`/issues/${taskId}`}
      className={className}
      onClick={handleClick}
      onMouseEnter={() => prefetchIssueDetail(taskId)}
      onFocus={() => prefetchIssueDetail(taskId)}
    >
      {children}
    </Link>
  );
}
