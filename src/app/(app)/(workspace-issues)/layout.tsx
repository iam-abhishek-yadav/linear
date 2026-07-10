import { Suspense } from "react";
import { WorkspaceIssuesView } from "@/components/list/workspace-issues-view";

export default function WorkspaceIssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <WorkspaceIssuesView />
      </Suspense>
      {children}
    </>
  );
}
