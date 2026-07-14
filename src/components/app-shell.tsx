"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { SidebarProvider, useSidebar } from "@/components/sidebar-provider";
import { cn } from "@/lib/utils";

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <div className="flex h-screen bg-black p-[10px]">
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex bg-black shadow-2xl transition-transform duration-200 ease-out md:static md:z-auto md:shadow-none md:transition-none",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <AppSidebar />
      </div>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellContent>{children}</ShellContent>
    </SidebarProvider>
  );
}
