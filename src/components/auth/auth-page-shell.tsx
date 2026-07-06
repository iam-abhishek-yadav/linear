import type { ReactNode } from "react";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full justify-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col justify-center py-6">
        {children}
      </div>
    </div>
  );
}
