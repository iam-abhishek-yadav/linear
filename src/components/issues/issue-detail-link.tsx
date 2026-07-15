"use client";

import Link from "next/link";
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
  const prefetchIssueDetail = usePrefetchIssueDetail();

  return (
    <Link
      href={`/issues/${taskId}`}
      className={className}
      onClick={onClick}
      onMouseEnter={() => prefetchIssueDetail(taskId)}
      onFocus={() => prefetchIssueDetail(taskId)}
    >
      {children}
    </Link>
  );
}
