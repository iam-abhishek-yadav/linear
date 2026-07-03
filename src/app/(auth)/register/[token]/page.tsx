"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type InviteInfo = {
  email: string | null;
  expiresAt: string;
};

export default function RegisterWithInvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        orgName: formData.get("orgName"),
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      setLoading(false);
      return;
    }

    router.push("/board");
    router.refresh();
  }

  if (validating) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Validating invite...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
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
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle>Create your workspace</CardTitle>
          <CardDescription>
            You&apos;ve been invited to set up an organization and admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="orgName">Organization name</FieldLabel>
                <Input
                  id="orgName"
                  name="orgName"
                  placeholder="Acme Inc."
                  required
                  aria-invalid={!!errors.orgName}
                />
                <FieldError errors={errors.orgName?.map((message) => ({ message }))} />
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Your name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Doe"
                  required
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={errors.name?.map((message) => ({ message }))} />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  defaultValue={invite?.email ?? ""}
                  readOnly={!!invite?.email}
                  required
                  aria-invalid={!!errors.email}
                />
                <FieldError errors={errors.email?.map((message) => ({ message }))} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.password}
                />
                <FieldDescription>At least 8 characters.</FieldDescription>
                <FieldError errors={errors.password?.map((message) => ({ message }))} />
              </Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating workspace..." : "Create workspace"}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
