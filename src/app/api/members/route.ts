import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { getMembersPageData } from "@/lib/members";

export const GET = withApiRoute("members.list", async () => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getMembersPageData());
});
