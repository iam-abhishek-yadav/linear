"use client";

import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function BoardPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <KanbanBoard />
    </div>
  );
}
