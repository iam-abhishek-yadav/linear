import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getNotifications, serializeNotification } from "@/lib/notifications";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getNotifications(
    session.user.id,
    session.organization.id,
  );
  return NextResponse.json(rows.map(serializeNotification));
}
