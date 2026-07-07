import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const updated = await markNotificationRead(session.user.id, id);

  if (!updated) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
