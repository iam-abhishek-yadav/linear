import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrgNotifications } from "@/lib/notifications";
import { withApiRoute } from "@/lib/logger";

export const GET = withApiRoute("notifications.list", async () => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getOrgNotifications());
});
