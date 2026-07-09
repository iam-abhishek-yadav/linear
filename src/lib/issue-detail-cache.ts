import type { IssueDetailData } from "@/lib/issue-detail-data";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  data: IssueDetailData;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<IssueDetailData | null>>();

function isFresh(entry: CacheEntry) {
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export function getCachedIssueDetail(taskId: string) {
  const entry = cache.get(taskId);
  if (!entry || !isFresh(entry)) return null;
  return entry.data;
}

export function setCachedIssueDetail(taskId: string, data: IssueDetailData) {
  cache.set(taskId, { data, fetchedAt: Date.now() });
}

export function invalidateIssueDetail(taskId: string) {
  cache.delete(taskId);
  inflight.delete(taskId);
}

async function fetchIssueDetail(taskId: string): Promise<IssueDetailData | null> {
  const response = await fetch(`/api/tasks/${taskId}/detail`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load issue");
  const data: IssueDetailData = await response.json();
  setCachedIssueDetail(taskId, data);
  return data;
}

export function loadIssueDetail(taskId: string): Promise<IssueDetailData | null> {
  const cached = getCachedIssueDetail(taskId);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(taskId);
  if (pending) return pending;

  const request = fetchIssueDetail(taskId).finally(() => {
    inflight.delete(taskId);
  });
  inflight.set(taskId, request);
  return request;
}

export function prefetchIssueDetail(taskId: string) {
  if (!taskId || getCachedIssueDetail(taskId) || inflight.has(taskId)) return;
  void loadIssueDetail(taskId);
}
