import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { WelcomePage } from "@/components/auth/welcome-page";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const session = await getCurrentUser();

  if (session) {
    redirect("/board");
  }

  return (
    <AuthPageShell>
      <WelcomePage />
    </AuthPageShell>
  );
}
