import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getNotifications(session.user.id);

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      read: row.readAt !== null,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor?.id ? row.actor : null,
      task: row.task,
    })),
  );
}
