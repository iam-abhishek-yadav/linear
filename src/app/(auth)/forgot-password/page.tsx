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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      return;
    }

    setMessage(data.message);
    setStep("reset");
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        otp,
        newPassword,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="w-full border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          {step === "request"
            ? "Enter your account email and we'll send you a 6-digit reset code."
            : "Enter the code from your email and choose a new password."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={handleRequestCode}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  aria-invalid={!!errors.email}
                />
                <FieldError
                  errors={errors.email?.map((message) => ({ message }))}
                />
              </Field>

              <FieldError
                errors={errors.form?.map((message) => ({ message }))}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending email..." : "Send reset email"}
              </Button>
            </FieldGroup>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <FieldGroup>
              {message && (
                <p className="rounded-md border border-border/60 bg-black/20 px-3 py-2 text-sm text-muted-foreground">
                  {message}
                </p>
              )}

              <Field>
                <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-invalid={!!errors.email}
                />
                <FieldError
                  errors={errors.email?.map((message) => ({ message }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="otp">6-digit code</FieldLabel>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  required
                  aria-invalid={!!errors.otp}
                />
                <FieldError errors={errors.otp?.map((message) => ({ message }))} />
              </Field>

              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.newPassword}
                />
                <FieldError
                  errors={errors.newPassword?.map((message) => ({ message }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.confirmPassword}
                />
                <FieldError
                  errors={errors.confirmPassword?.map((message) => ({
                    message,
                  }))}
                />
              </Field>

              <FieldError
                errors={errors.form?.map((message) => ({ message }))}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrors({});
                  setMessage(null);
                }}
              >
                Request a new code
              </Button>
            </FieldGroup>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
