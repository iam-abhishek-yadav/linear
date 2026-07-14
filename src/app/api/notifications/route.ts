import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { getOrgNotifications } from "@/lib/notifications";
import { withApiRoute } from "@/lib/logger";

export const GET = withApiRoute("notifications.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;

  return NextResponse.json(await getOrgNotifications());
});
