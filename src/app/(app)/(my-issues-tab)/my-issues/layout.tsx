import { Suspense } from "react";
import { MyIssuesView } from "@/components/list/my-issues-view";

export default function MyIssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <MyIssuesView />
      </Suspense>
      {children}
    </>
  );
}
