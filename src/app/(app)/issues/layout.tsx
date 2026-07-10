"use client";

import { usePathname } from "next/navigation";
import { IssueDetailRoute } from "@/components/issues/issue-detail-route";

function getTaskIdFromPath(pathname: string) {
  const match = pathname.match(/^\/issues\/([^/]+)$/);
  return match?.[1] ?? null;
}

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const taskId = getTaskIdFromPath(pathname);

  if (taskId) {
    return <IssueDetailRoute taskId={taskId} />;
  }

  return children;
}
