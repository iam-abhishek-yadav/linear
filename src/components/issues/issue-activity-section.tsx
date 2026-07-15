"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { CommentBodyWithMentions } from "@/components/issues/comment-body-with-mentions";
import { CommentMentionInput } from "@/components/issues/comment-mention-input";
import { TaskActivityFeed } from "@/components/issues/task-activity-feed";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { TaskCommentItem } from "@/lib/task-comments";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import type { Member } from "@/hooks/use-members";
import { formatActivityTime } from "@/lib/task-activity-format";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

function CommentAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white",
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

type IssueActivitySectionProps = {
  taskId: string;
  activities: TaskActivityItem[];
  comments: TaskCommentItem[];
  members: Member[];
  onAddComment: (comment: TaskCommentItem) => void;
  onRemoveComment: (commentId: string) => void;
  onChange?: () => void | Promise<void>;
};

export function IssueActivitySection({
  taskId,
  activities,
  comments,
  members,
  onAddComment,
  onRemoveComment,
  onChange,
}: IssueActivitySectionProps) {
  const { user } = useSession();
  const [body, setBody] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user.role === "ADMIN";

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed,
          mentionedUserIds,
        }),
      });
      if (!response.ok) return;
      const comment: TaskCommentItem = await response.json();
      onAddComment(comment);
      setBody("");
      setMentionedUserIds([]);
      await onChange?.();
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
      onRemoveComment(commentId);
      await onChange?.();
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="space-y-4">
      <TaskActivityFeed activities={activities} />

      {comments.length > 0 && (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const canDelete = comment.user.id === user.id || isAdmin;
            return (
              <li key={comment.id} className="group flex items-start gap-3">
                <CommentAvatar name={comment.user.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground">
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
                  <CommentBodyWithMentions
                    body={comment.body}
                    members={members}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="min-w-0 flex-1">
        <CommentMentionInput
          value={body}
          mentionedUserIds={mentionedUserIds}
          members={members}
          onChange={(next, ids) => {
            setBody(next);
            setMentionedUserIds(ids);
          }}
          onKeyDown={handleKeyDown}
        />
        {body.trim() && (
          <div className="mt-2 flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => void submit()}
              className="rounded-md bg-violet-600 px-3 text-white hover:bg-violet-600/90"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
