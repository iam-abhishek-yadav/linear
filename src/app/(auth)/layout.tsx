import type { ReactNode } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
