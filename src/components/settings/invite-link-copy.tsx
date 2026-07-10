"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InviteLinkCopyProps = {
  url: string;
  className?: string;
  compact?: boolean;
};

export function InviteLinkCopy({ url, className, compact }: InviteLinkCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-7 shrink-0 text-[13px]", className)}
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="size-3" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3" />
            Copy link
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-lg border border-border/60 bg-black/30 p-3">
        <p className="mb-2 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          Invite link
        </p>
        <p className="break-all font-mono text-[13px] leading-relaxed text-foreground">
          {url}
        </p>
      </div>
      <Button
        type="button"
        className="w-full bg-violet-600 text-white hover:bg-violet-500"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="size-3.5" />
            Copied to clipboard
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy invite link
          </>
        )}
      </Button>
    </div>
  );
}
