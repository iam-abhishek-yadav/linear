"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { useTasks } from "@/hooks/use-tasks";
import type { TaskInput } from "@/hooks/use-tasks";

export const CREATE_ISSUE_OPEN_EVENT = "create-issue:open";

export function openCreateIssue() {
  window.dispatchEvent(new Event(CREATE_ISSUE_OPEN_EVENT));
}

export function CreateIssueDialog() {
  const router = useRouter();
  const { createTask } = useTasks();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }

    window.addEventListener(CREATE_ISSUE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CREATE_ISSUE_OPEN_EVENT, onOpen);
  }, []);

  async function handleCreate(data: TaskInput) {
    const task = await createTask(data);
    setOpen(false);
    router.push(`/issues/${task.id}`);
  }

  return (
    <TaskDialog
      open={open}
      onOpenChange={setOpen}
      defaultStatus="TODO"
      onSave={handleCreate}
    />
  );
}
