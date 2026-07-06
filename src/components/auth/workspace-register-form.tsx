"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

type WorkspaceRegisterFormProps = {
  token?: string;
  lockedEmail?: string | null;
  title?: string;
  description?: string;
  showSignInLink?: boolean;
};

export function WorkspaceRegisterForm({
  token,
  lockedEmail,
  title = "Create your workspace",
  description = "Set up your organization and admin account.",
  showSignInLink = true,
}: WorkspaceRegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(token ? { token } : {}),
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

  return (
    <Card className="w-full border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
                defaultValue={lockedEmail ?? ""}
                readOnly={!!lockedEmail}
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

        {showSignInLink && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
