import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MembersProvider } from "@/components/members-provider";
import { NotificationsProvider } from "@/components/notifications-provider";
import { QueryProvider } from "@/components/query-provider";
import { SessionProvider } from "@/components/session-provider";
import { TasksProvider } from "@/components/tasks-provider";
import { getCurrentUser } from "@/lib/auth";
import { logPageRender } from "@/lib/logger";
import { getOrgMembers } from "@/lib/members";
import { getOrgNotifications } from "@/lib/notifications";
import { getOrgTasks } from "@/lib/tasks";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return logPageRender("app.layout", async () => {
    const session = await getCurrentUser();

    if (!session) {
      redirect("/login");
    }

    const [members, tasks, notifications] = await Promise.all([
      getOrgMembers(),
      getOrgTasks(),
      getOrgNotifications(),
    ]);

    return (
      <QueryProvider>
        <SessionProvider value={session}>
          <MembersProvider members={members}>
            <TasksProvider initialTasks={tasks}>
              <NotificationsProvider initialNotifications={notifications}>
                <AppShell>{children}</AppShell>
              </NotificationsProvider>
            </TasksProvider>
          </MembersProvider>
        </SessionProvider>
      </QueryProvider>
    );
  });
}
