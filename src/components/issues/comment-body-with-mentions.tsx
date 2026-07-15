"use client";

import { Fragment } from "react";
import { splitCommentMentions } from "@/lib/comment-mentions";

type MentionMember = {
  id: string;
  name: string;
};

export function CommentBodyWithMentions({
  body,
  members,
}: {
  body: string;
  members: MentionMember[];
}) {
  const parts = splitCommentMentions(body, members);

  return (
    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
      {parts.map((part, index) =>
        part.type === "mention" ? (
          <span
            key={index}
            className="rounded px-0.5 font-medium text-violet-300"
          >
            {part.value}
          </span>
        ) : (
          <Fragment key={index}>{part.value}</Fragment>
        ),
      )}
    </p>
  );
}
