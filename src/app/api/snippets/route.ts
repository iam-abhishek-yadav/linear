import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { createCodeSnippetSchema } from "@/lib/snippet-validations";
import {
  countUnreadSnippets,
  createSnippet,
  getOrganizationMemberId,
  listSnippetsForUser,
} from "@/lib/snippets";
import { zodErrorResponse } from "@/lib/validations";

export const GET = withApiRoute("snippets.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const [snippets, unreadCount] = await Promise.all([
    listSnippetsForUser(session.organization.id, session.user.id),
    countUnreadSnippets(session.organization.id, session.user.id),
  ]);

  return NextResponse.json({ snippets, unreadCount });
});

export const POST = withApiRoute("snippets.create", async (request: Request) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = createCodeSnippetSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  if (parsed.data.recipientId === session.user.id) {
    return NextResponse.json(
      { error: { recipientId: ["Choose someone else in your workspace"] } },
      { status: 400 },
    );
  }

  const recipientId = await getOrganizationMemberId(
    session.organization.id,
    parsed.data.recipientId,
  );

  if (!recipientId) {
    return NextResponse.json(
      { error: { recipientId: ["Recipient must be in your organization"] } },
      { status: 400 },
    );
  }

  const snippet = await createSnippet({
    organizationId: session.organization.id,
    authorId: session.user.id,
    recipientId,
    title: parsed.data.title,
    language: parsed.data.language,
    body: parsed.data.body,
  });

  return NextResponse.json({ snippet }, { status: 201 });
});
