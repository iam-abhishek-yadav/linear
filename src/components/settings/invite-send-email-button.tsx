"use client";

import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InviteSendEmailButtonProps = {
  inviteId: string;
  className?: string;
  compact?: boolean;
};

export function InviteSendEmailButton({
  inviteId,
  className,
  compact,
}: InviteSendEmailButtonProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setError(null);

    const response = await fetch(
      `/api/members/invites/manage/${inviteId}/send`,
      { method: "POST" },
    );
    const data = await response.json();

    setSending(false);

    if (!response.ok) {
      setError(data.error ?? "Failed to send email");
      return;
    }

    setSent(true);
  }

  if (compact) {
    return (
      <div className={cn("flex flex-col items-end gap-1", className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 text-[13px]"
          disabled={sending || sent}
          onClick={handleSend}
        >
          {sent ? (
            <>
              <Check className="size-3" />
              Sent
            </>
          ) : (
            <>
              <Mail className="size-3" />
              {sending ? "Sending..." : "Send email"}
            </>
          )}
        </Button>
        {error && (
          <p className="max-w-48 text-right text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={sending || sent}
        onClick={handleSend}
      >
        {sent ? (
          <>
            <Check className="size-3.5" />
            Email sent
          </>
        ) : (
          <>
            <Mail className="size-3.5" />
            {sending ? "Sending email..." : "Send email"}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
