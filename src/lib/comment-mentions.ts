/**
 * Keep mentioned ids whose `@Display Name` still appears in the comment body.
 * Longer names are checked first so "Jane Doe" wins over "Jane".
 */
export function mentionedIdsStillInBody(
  body: string,
  mentions: { id: string; name: string }[],
): string[] {
  const sorted = [...mentions].sort(
    (a, b) => b.name.length - a.name.length,
  );
  const found = new Set<string>();

  for (const mention of sorted) {
    const token = `@${mention.name}`;
    if (body.includes(token)) {
      found.add(mention.id);
    }
  }

  return [...found];
}

type CommentMentionMember = {
  id: string;
  name: string;
};

/**
 * Split comment body into plain text and mention segments for display.
 * Matches known member display names (longest first).
 */
export function splitCommentMentions(
  body: string,
  members: CommentMentionMember[],
): { type: "text" | "mention"; value: string; userId?: string }[] {
  if (!body) return [];

  const names = [...members]
    .map((m) => m.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (names.length === 0) {
    return [{ type: "text", value: body }];
  }

  const nameToId = new Map(members.map((m) => [m.name, m.id]));
  const escaped = names.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`@(${escaped.join("|")})`, "g");

  const parts: { type: "text" | "mention"; value: string; userId?: string }[] =
    [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    const name = match[1]!;
    parts.push({
      type: "mention",
      value: `@${name}`,
      userId: nameToId.get(name),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: body }];
}
