import { NextResponse } from "next/server";
import { requireMemberManagerOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { getMembersPageData } from "@/lib/members";

export const GET = withApiRoute("members.list", async () => {
  const guard = await requireMemberManagerOrResponse();
  if (guard.response) return guard.response;

  return NextResponse.json(await getMembersPageData());
});
