import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MembersProvider } from "@/components/members-provider";
import { NotificationsProvider } from "@/components/notifications-provider";
import { SessionProvider } from "@/components/session-provider";
import { getCurrentUser } from "@/lib/auth";
import { logPageRender } from "@/lib/logger";
import { getOrgMembers } from "@/lib/members";

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

    const members = await getOrgMembers();

    return (
      <SessionProvider value={session}>
        <MembersProvider members={members}>
          <NotificationsProvider>
            <AppShell>{children}</AppShell>
          </NotificationsProvider>
        </MembersProvider>
      </SessionProvider>
    );
  });
}
