"use client";

import Link from "next/link";
import { prefetchIssueDetail } from "@/lib/issue-detail-cache";
import { prefetchMembers } from "@/hooks/use-members-cache";

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
  function handlePrefetch() {
    prefetchMembers();
    prefetchIssueDetail(taskId);
  }

  return (
    <Link
      href={`/issues/${taskId}`}
      className={className}
      onClick={onClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
    >
      {children}
    </Link>
  );
}

export function prefetchIssueNavigation(taskId: string) {
  prefetchMembers();
  prefetchIssueDetail(taskId);
}
