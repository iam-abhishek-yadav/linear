import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { markSnippetRead } from "@/lib/snippets";

export const PATCH = withApiRoute(
  "snippets.markRead",
  async (
    _request: Request,
    context: { params: Promise<{ id: string }> },
  ) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id } = await context.params;

    const snippet = await markSnippetRead({
      organizationId: session.organization.id,
      userId: session.user.id,
      snippetId: id,
    });

    if (!snippet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ snippet });
  },
);
