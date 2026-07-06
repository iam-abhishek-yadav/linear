"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceRegisterForm } from "@/components/auth/workspace-register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InviteInfo = {
  email: string | null;
  expiresAt: string;
};

export default function RegisterWithInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [validating, setValidating] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function validateInvite() {
      const response = await fetch(`/api/invites/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setInviteError(data.error ?? "This invite is invalid or has expired");
        setValidating(false);
        return;
      }

      setInvite(data);
      setValidating(false);
    }

    validateInvite();
  }, [token]);

  if (validating) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Validating invite...
      </p>
    );
  }

  if (inviteError) {
    return (
      <Card className="w-full border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle>Invalid invite</CardTitle>
          <CardDescription>{inviteError}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <WorkspaceRegisterForm
      token={token}
      lockedEmail={invite?.email}
      description="You've been invited to set up an organization and admin account."
      showSignInLink={false}
    />
  );
}
