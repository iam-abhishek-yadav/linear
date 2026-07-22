"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSnippet,
  fetchSnippets,
  markSnippetRead,
} from "@/lib/api";
import type { CodeSnippetLanguage } from "@/db/schema";
import type { SnippetItem } from "@/lib/snippets";
import {
  NOTIFICATIONS_POLL_MS,
  queryKeys,
  SNIPPETS_POLL_MS,
  STALE_TIME_MS,
} from "@/lib/query-keys";

export function useSnippets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.snippets,
    queryFn: fetchSnippets,
    staleTime: STALE_TIME_MS,
    refetchInterval: SNIPPETS_POLL_MS,
  });

  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      language: CodeSnippetLanguage;
      body: string;
      recipientId: string;
    }) => createSnippet(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.snippets });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markSnippetRead(id),
    onSuccess: (snippet) => {
      queryClient.setQueryData<{
        snippets: SnippetItem[];
        unreadCount: number;
      }>(queryKeys.snippets, (current) => {
        if (!current) return current;
        const snippets = current.snippets.map((item) =>
          item.id === snippet.id ? snippet : item,
        );
        const unreadCount = snippets.filter((item) => item.unread).length;
        return { snippets, unreadCount };
      });
    },
  });

  return {
    snippets: query.data?.snippets ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    loading: query.isLoading,
    refresh: () => query.refetch(),
    createSnippet: createMutation.mutateAsync,
    creating: createMutation.isPending,
    markRead: markReadMutation.mutateAsync,
  };
}

/** Lightweight unread badge for the sidebar — shares the snippets query cache. */
export function useSnippetUnreadCount() {
  const query = useQuery({
    queryKey: queryKeys.snippets,
    queryFn: fetchSnippets,
    staleTime: STALE_TIME_MS,
    refetchInterval: NOTIFICATIONS_POLL_MS,
    select: (data) => data.unreadCount,
  });

  return query.data ?? 0;
}
