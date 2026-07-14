import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";
import { withApiRoute } from "@/lib/logger";

export const POST = withApiRoute("notifications.readAll", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  await markAllNotificationsRead(session.user.id);

  return NextResponse.json({ success: true });
});
