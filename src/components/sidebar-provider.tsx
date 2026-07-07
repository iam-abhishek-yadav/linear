"use client";

import { createContext, useContext, useState } from "react";
import { PanelLeft } from "lucide-react";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ open, setOpen, toggle: () => setOpen(!open) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle sidebar"
      className={
        "-ml-1 mr-1 rounded-md p-1.5 text-muted-foreground/60 hover:bg-white/[0.05] hover:text-foreground md:hidden" +
        (className ? " " + className : "")
      }
    >
      <PanelLeft className="size-4" />
    </button>
  );
}
