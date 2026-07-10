import { NextResponse } from "next/server";
import { withApiRoute } from "@/lib/logger";

export const GET = withApiRoute("health.check", async () => {
  return NextResponse.json({ status: "ok" });
});
