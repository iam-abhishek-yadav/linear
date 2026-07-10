import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";
import { withApiRoute } from "@/lib/logger";

export const POST = withApiRoute("notifications.readAll", async () => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsRead(session.user.id);

  return NextResponse.json({ success: true });
});
