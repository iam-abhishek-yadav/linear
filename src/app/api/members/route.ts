import { NextResponse } from "next/server";
import { requireMemberManager } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { getMembersPageData } from "@/lib/members";

export const GET = withApiRoute("members.list", async () => {
  const session = await requireMemberManager();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getMembersPageData());
});
