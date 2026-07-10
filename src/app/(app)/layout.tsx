import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NotificationsProvider } from "@/components/notifications-provider";
import { SessionProvider } from "@/components/session-provider";
import { getCurrentUser } from "@/lib/auth";
import { logPageRender } from "@/lib/logger";

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

    return (
      <SessionProvider value={session}>
        <NotificationsProvider>
          <AppShell>{children}</AppShell>
        </NotificationsProvider>
      </SessionProvider>
    );
  });
}
