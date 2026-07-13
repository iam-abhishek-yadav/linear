import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq, inArray } from "drizzle-orm";
import { tags, taskTags } from "@/db/schema";
import { db, isUniqueViolationError } from "@/lib/db";
import { pickTagColor } from "@/lib/tag-colors";

export type TaskTagSummary = {
  id: string;
  name: string;
  color: string;
};

export async function getOrgTags(organizationId: string) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .where(eq(tags.organizationId, organizationId))
    .orderBy(asc(tags.name));
}

export async function getTagsForTaskIds(
  taskIds: string[],
): Promise<Map<string, TaskTagSummary[]>> {
  const map = new Map<string, TaskTagSummary[]>();

  if (taskIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      taskId: taskTags.taskId,
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(inArray(taskTags.taskId, taskIds))
    .orderBy(asc(tags.name));

  for (const row of rows) {
    const current = map.get(row.taskId) ?? [];
    current.push({ id: row.id, name: row.name, color: row.color });
    map.set(row.taskId, current);
  }

  return map;
}

export async function getTagsForTask(taskId: string) {
  const map = await getTagsForTaskIds([taskId]);
  return map.get(taskId) ?? [];
}

export async function createOrgTag({
  organizationId,
  name,
  color,
}: {
  organizationId: string;
  name: string;
  color?: string;
}) {
  const normalizedName = name.trim();
  const id = createId();

  try {
    const [created] = await db
      .insert(tags)
      .values({
        id,
        organizationId,
        name: normalizedName,
        color: color ?? pickTagColor(normalizedName),
      })
      .returning({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      });

    return created;
  } catch (error) {
    if (isUniqueViolationError(error)) {
      throw new Error("DUPLICATE_TAG");
    }
    throw error;
  }
}

export async function setTaskTags({
  organizationId,
  taskId,
  tagIds,
}: {
  organizationId: string;
  taskId: string;
  tagIds: string[];
}) {
  const uniqueTagIds = [...new Set(tagIds)];

  if (uniqueTagIds.length > 0) {
    const validTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.organizationId, organizationId),
          inArray(tags.id, uniqueTagIds),
        ),
      );

    if (validTags.length !== uniqueTagIds.length) {
      throw new Error("Invalid tag selection");
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(taskTags).where(eq(taskTags.taskId, taskId));

    if (uniqueTagIds.length > 0) {
      await tx.insert(taskTags).values(
        uniqueTagIds.map((tagId) => ({
          taskId,
          tagId,
        })),
      );
    }
  });

  return getTagsForTask(taskId);
}

export function attachTagsToTasks<T extends { id: string }>(
  taskRows: T[],
  tagsByTaskId: Map<string, TaskTagSummary[]>,
) {
  return taskRows.map((task) => ({
    ...task,
    tags: tagsByTaskId.get(task.id) ?? [],
  }));
}
