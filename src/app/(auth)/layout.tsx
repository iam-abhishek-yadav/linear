import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser();

  if (session) {
    redirect("/board");
  }

  return <AuthPageShell>{children}</AuthPageShell>;
}
