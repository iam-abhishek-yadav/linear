"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectAccessDenied } from "@/lib/api";
import { requestProjectAccess } from "@/lib/api";

export function IssueProjectAccessDenied({
  access,
  onRequested,
}: {
  access: ProjectAccessDenied;
  onRequested?: (status: "PENDING") => void;
}) {
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState(access.accessRequestStatus);

  const pending = status === "PENDING";
  const denied = status === "DENIED";

  async function handleRequest() {
    setRequesting(true);
    try {
      await requestProjectAccess(access.project.id);
      setStatus("PENDING");
      onRequested?.("PENDING");
    } catch {
      // keep previous status
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground">
        <FolderKanban className="size-5" />
      </span>
      <div className="space-y-1.5">
        <p className="text-[15px] font-medium text-foreground">
          You don&apos;t have access to this project
        </p>
        <p className="max-w-sm text-[14px] text-muted-foreground">
          This issue belongs to{" "}
          <span className="text-foreground/85">{access.project.name}</span>.
          Request access to view it.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {pending ? (
          <span className="rounded-md border border-border/50 px-3 py-1.5 text-[13px] text-muted-foreground">
            Access requested
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={requesting}
            onClick={() => void handleRequest()}
            className="bg-violet-600 text-white hover:bg-violet-500"
          >
            {requesting && <Loader2 className="size-3.5 animate-spin" />}
            {denied ? "Request again" : "Request access"}
          </Button>
        )}
        <Link
          href="/inbox"
          className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
        >
          Back to inbox
        </Link>
      </div>
    </div>
  );
}
