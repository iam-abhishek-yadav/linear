"use client";

import { useState } from "react";
import { InviteLinkCopy } from "@/components/settings/invite-link-copy";
import { InviteSendEmailButton } from "@/components/settings/invite-send-email-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setErrors({});
    setInviteUrl(null);
    setInviteId(null);
    setLoading(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const response = await fetch("/api/members/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      setLoading(false);
      return;
    }

    setInviteUrl(data.invite.inviteUrl);
    setInviteId(data.invite.id);
    setLoading(false);
    onInvited();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/60 bg-[#1a1a1c] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{inviteUrl ? "Invite created" : "Invite member"}</DialogTitle>
          <DialogDescription>
            {inviteUrl
              ? "Share this link manually, or send it by email when you're ready."
              : "Enter their email to generate an invite link you can share manually."}
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite link for{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <InviteLinkCopy url={inviteUrl} />
            {inviteId && <InviteSendEmailButton inviteId={inviteId} />}
            <DialogFooter className="border-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  required
                  aria-invalid={!!errors.email}
                />
                <FieldError errors={errors.email?.map((message) => ({ message }))} />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4 border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 text-white hover:bg-violet-500"
                disabled={loading}
              >
                {loading ? "Creating invite..." : "Create invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
