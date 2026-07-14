"use client";

import { useCallback, useEffect, useState } from "react";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { TaskCommentItem } from "@/lib/task-comments";

type TaskTimelineInitial = {
  activities: TaskActivityItem[];
  comments: TaskCommentItem[];
};

export function useTaskTimeline(
  taskId: string,
  initial?: TaskTimelineInitial,
) {
  const [activities, setActivities] = useState<TaskActivityItem[]>(
    initial?.activities ?? [],
  );
  const [comments, setComments] = useState<TaskCommentItem[]>(
    initial?.comments ?? [],
  );

  useEffect(() => {
    setActivities(initial?.activities ?? []);
    setComments(initial?.comments ?? []);
  }, [initial?.activities, initial?.comments]);

  const appendActivity = useCallback((activity: TaskActivityItem) => {
    setActivities((prev) => [...prev, activity]);
  }, []);

  const removeActivity = useCallback((activityId: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== activityId));
  }, []);

  const addComment = useCallback((comment: TaskCommentItem) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  const removeComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  return {
    activities,
    comments,
    appendActivity,
    removeActivity,
    addComment,
    removeComment,
  };
}
