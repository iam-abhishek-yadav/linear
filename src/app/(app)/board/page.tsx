import { KanbanBoard } from "@/components/kanban/kanban-board";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function BoardPage() {
  return logPageRender("board", async () => {
    const members = await getOrgMembers();

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <KanbanBoard members={members} />
      </div>
    );
  });
}
