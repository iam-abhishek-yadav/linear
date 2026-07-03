"use client";

import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-black p-[10px]">
      <AppSidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        {children}
      </main>
    </div>
  );
}
