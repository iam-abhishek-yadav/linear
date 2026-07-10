import { KanbanBoard } from "@/components/kanban/kanban-board";
import { getOrgMembers } from "@/lib/members";

export default async function BoardPage() {
  const members = await getOrgMembers();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <KanbanBoard members={members} />
    </div>
  );
}
