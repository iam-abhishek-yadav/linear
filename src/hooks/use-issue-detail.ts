"use client";

import { useEffect, useState } from "react";
import {
  getCachedIssueDetail,
  loadIssueDetail,
} from "@/lib/issue-detail-cache";
import type { IssueDetailData } from "@/lib/issue-detail-data";

export function useIssueDetail(taskId: string) {
  const [data, setData] = useState<IssueDetailData | null>(() =>
    getCachedIssueDetail(taskId),
  );
  const [loading, setLoading] = useState(() => !getCachedIssueDetail(taskId));
  const [error, setError] = useState<"not_found" | "failed" | null>(null);

  useEffect(() => {
    const cached = getCachedIssueDetail(taskId);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setData(null);

    loadIssueDetail(taskId)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setError("not_found");
          return;
        }
        setData(result);
      })
      .catch(() => {
        if (active) setError("failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taskId]);

  return { data, loading, error, setData };
}
