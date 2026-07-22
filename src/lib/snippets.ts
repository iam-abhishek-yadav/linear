import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, eq, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { codeSnippets, users, type CodeSnippetLanguage } from "@/db/schema";
import { db } from "@/lib/db";
import { formatSnippetBody } from "@/lib/format-snippet";

export type SnippetPerson = {
  id: string;
  name: string;
  email: string;
};

export type SnippetItem = {
  id: string;
  title: string | null;
  language: CodeSnippetLanguage;
  body: string;
  createdAt: string;
  readAt: string | null;
  direction: "sent" | "received";
  unread: boolean;
  author: SnippetPerson;
  recipient: SnippetPerson;
};

function toIso(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

function mapRow(
  row: {
    id: string;
    title: string | null;
    language: CodeSnippetLanguage;
    body: string;
    createdAt: Date | string;
    readAt: Date | string | null;
    authorId: string;
    recipientId: string;
    authorName: string;
    authorEmail: string;
    recipientName: string;
    recipientEmail: string;
  },
  userId: string,
): SnippetItem {
  const direction = row.authorId === userId ? "sent" : "received";
  return {
    id: row.id,
    title: row.title,
    language: row.language,
    body: row.body,
    createdAt: toIso(row.createdAt),
    readAt: row.readAt ? toIso(row.readAt) : null,
    direction,
    unread: direction === "received" && row.readAt === null,
    author: {
      id: row.authorId,
      name: row.authorName,
      email: row.authorEmail,
    },
    recipient: {
      id: row.recipientId,
      name: row.recipientName,
      email: row.recipientEmail,
    },
  };
}

async function fetchSnippetById(
  snippetId: string,
  viewerUserId: string,
): Promise<SnippetItem | null> {
  const author = alias(users, "snippet_author");
  const recipient = alias(users, "snippet_recipient");

  const [row] = await db
    .select({
      id: codeSnippets.id,
      title: codeSnippets.title,
      language: codeSnippets.language,
      body: codeSnippets.body,
      createdAt: codeSnippets.createdAt,
      readAt: codeSnippets.readAt,
      authorId: codeSnippets.authorId,
      recipientId: codeSnippets.recipientId,
      authorName: author.name,
      authorEmail: author.email,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
    })
    .from(codeSnippets)
    .innerJoin(author, eq(codeSnippets.authorId, author.id))
    .innerJoin(recipient, eq(codeSnippets.recipientId, recipient.id))
    .where(eq(codeSnippets.id, snippetId))
    .limit(1);

  if (!row) return null;
  return mapRow(row, viewerUserId);
}

export async function listSnippetsForUser(
  organizationId: string,
  userId: string,
): Promise<SnippetItem[]> {
  const author = alias(users, "snippet_author");
  const recipient = alias(users, "snippet_recipient");

  const rows = await db
    .select({
      id: codeSnippets.id,
      title: codeSnippets.title,
      language: codeSnippets.language,
      body: codeSnippets.body,
      createdAt: codeSnippets.createdAt,
      readAt: codeSnippets.readAt,
      authorId: codeSnippets.authorId,
      recipientId: codeSnippets.recipientId,
      authorName: author.name,
      authorEmail: author.email,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
    })
    .from(codeSnippets)
    .innerJoin(author, eq(codeSnippets.authorId, author.id))
    .innerJoin(recipient, eq(codeSnippets.recipientId, recipient.id))
    .where(
      and(
        eq(codeSnippets.organizationId, organizationId),
        or(
          eq(codeSnippets.authorId, userId),
          eq(codeSnippets.recipientId, userId),
        ),
      ),
    )
    .orderBy(desc(codeSnippets.createdAt))
    .limit(200);

  return rows.map((row) => mapRow(row, userId));
}

export async function countUnreadSnippets(
  organizationId: string,
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(codeSnippets)
    .where(
      and(
        eq(codeSnippets.organizationId, organizationId),
        eq(codeSnippets.recipientId, userId),
        isNull(codeSnippets.readAt),
      ),
    );

  return row?.value ?? 0;
}

export async function createSnippet(input: {
  organizationId: string;
  authorId: string;
  recipientId: string;
  title: string;
  language: CodeSnippetLanguage;
  body: string;
}): Promise<SnippetItem> {
  const id = createId();
  const body = await formatSnippetBody(input.language, input.body);

  await db.insert(codeSnippets).values({
    id,
    organizationId: input.organizationId,
    authorId: input.authorId,
    recipientId: input.recipientId,
    title: input.title.trim(),
    language: input.language,
    body,
  });

  const created = await fetchSnippetById(id, input.authorId);
  if (!created) throw new Error("Failed to create snippet");
  return created;
}

export async function markSnippetRead(input: {
  organizationId: string;
  userId: string;
  snippetId: string;
}): Promise<SnippetItem | null> {
  const [existing] = await db
    .select()
    .from(codeSnippets)
    .where(
      and(
        eq(codeSnippets.id, input.snippetId),
        eq(codeSnippets.organizationId, input.organizationId),
        eq(codeSnippets.recipientId, input.userId),
      ),
    )
    .limit(1);

  if (!existing) return null;

  if (!existing.readAt) {
    await db
      .update(codeSnippets)
      .set({ readAt: sql`now()` })
      .where(eq(codeSnippets.id, input.snippetId));
  }

  return fetchSnippetById(input.snippetId, input.userId);
}

export async function getOrganizationMemberId(
  organizationId: string,
  memberId: string,
): Promise<string | null> {
  const [member] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.id, memberId), eq(users.organizationId, organizationId)),
    )
    .limit(1);

  return member?.id ?? null;
}
