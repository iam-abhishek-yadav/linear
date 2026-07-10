import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";

export const POST = withApiRoute("auth.logout", async () => {
  await deleteSession();
  return NextResponse.json({ success: true });
});
