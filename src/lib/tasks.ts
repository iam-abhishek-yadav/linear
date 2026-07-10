import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logServerCall } from "@/lib/logger";
import type { Task } from "@/lib/types";

async function queryOrgTasks(organizationId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.organizationId, organizationId))
    .orderBy(asc(tasks.status), asc(tasks.position));
}

export const getOrgTasks = cache(() =>
  logServerCall("getOrgTasks", async (): Promise<Task[]> => {
    const session = await getCurrentUser();
    if (!session) {
      return [];
    }

    return logServerCall("getOrgTasks.query", () =>
      queryOrgTasks(session.organization.id),
    );
  }),
);
