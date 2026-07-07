"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { formatActivityTime } from "@/lib/task-activity-format";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export type TaskCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
};

function CommentAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export function TaskComments({ taskId }: { taskId: string }) {
  const { user } = useSession();
  const [comments, setComments] = useState<TaskCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user.role === "ADMIN";

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/tasks/${taskId}/comments`);
    if (!response.ok) {
      setComments([]);
      setLoading(false);
      return;
    }
    const data = await response.json();
    setComments(data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    setLoading(true);
    loadComments();
  }, [loadComments]);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!response.ok) return;
      const comment: TaskCommentItem = await response.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(commentId: string) {
    setDeletingId(commentId);
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (!response.ok) return;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const canDelete = comment.user.id === user.id || isAdmin;
            return (
              <li key={comment.id} className="group flex items-start gap-3">
                <CommentAvatar name={comment.user.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatActivityTime(comment.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Delete comment"
                        onClick={() => remove(comment.id)}
                        disabled={deletingId === comment.id}
                        className="ml-auto rounded p-1 text-muted-foreground/0 transition-colors hover:bg-white/[0.06] hover:text-destructive group-hover:text-muted-foreground/60"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                    {comment.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-start gap-3">
        <CommentAvatar name={user.name} />
        <div className="min-w-0 flex-1" onKeyDown={handleKeyDown}>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Leave a comment…"
            rows={3}
            className="w-full resize-none rounded-md border border-border/60 bg-black/20 px-3 py-2 text-[13px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-border"
          />
          <div className="mt-2 flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!body.trim() || submitting}
              onClick={submit}
              className="rounded-md bg-violet-600 px-3 text-white hover:bg-violet-600/90"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
