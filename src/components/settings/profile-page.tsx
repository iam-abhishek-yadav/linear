"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type ProfileData = {
  name: string;
  email: string;
  passwordChangeRetryAt: string | null;
};

function formatRetryAt(retryAt: string | null) {
  if (!retryAt) {
    return null;
  }

  const date = new Date(retryAt);
  if (date <= new Date()) {
    return null;
  }

  return date.toLocaleString();
}

export function ProfilePage({ initialProfile }: { initialProfile: ProfileData }) {
  const router = useRouter();
  const { user } = useSession();
  const [name, setName] = useState(initialProfile.name);
  const [passwordChangeRetryAt, setPasswordChangeRetryAt] = useState(
    initialProfile.passwordChangeRetryAt,
  );
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);
  const passwordLockedUntil = formatRetryAt(passwordChangeRetryAt);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileErrors({});
    setProfileSaved(false);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    setProfileSaving(false);

    if (!response.ok) {
      setProfileErrors(data.error ?? { form: ["Something went wrong"] });
      return;
    }

    setPasswordChangeRetryAt(data.profile.passwordChangeRetryAt);
    setProfileSaved(true);
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordErrors({});
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordErrors({
        confirmPassword: ["Passwords do not match"],
      });
      return;
    }

    setPasswordSaving(true);

    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();
    setPasswordSaving(false);

    if (!response.ok) {
      setPasswordErrors(data.error ?? { form: ["Something went wrong"] });
      if (data.retryAt) {
        setPasswordChangeRetryAt(data.retryAt);
      }
      return;
    }

    setPasswordChangeRetryAt(data.passwordChangeRetryAt);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-4 md:px-8 md:py-6">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Profile
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white",
                avatarColor,
              )}
            >
              {initials}
            </span>
            <div>
              <p className="text-lg font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <section className="rounded-lg border border-border/40 p-4 md:p-6">
            <h2 className="text-[15px] font-medium">Account details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your display name.
            </p>

            <form className="mt-5" onSubmit={handleProfileSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                  <Input
                    id="profile-email"
                    type="email"
                    value={initialProfile.email}
                    disabled
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    aria-invalid={!!profileErrors.name}
                  />
                  <FieldError
                    errors={profileErrors.name?.map((message) => ({ message }))}
                  />
                </Field>

                <FieldError
                  errors={profileErrors.form?.map((message) => ({ message }))}
                />
              </FieldGroup>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save changes"}
                </Button>
                {profileSaved && (
                  <p className="text-sm text-emerald-400">Profile updated</p>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-border/40 p-4 md:p-6">
            <h2 className="text-[15px] font-medium">Change password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Password changes are limited to once every 30 days.
            </p>

            {passwordLockedUntil && (
              <p className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                You can change your password again after {passwordLockedUntil}.
              </p>
            )}

            <form className="mt-5" onSubmit={handlePasswordSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="current-password">
                    Current password
                  </FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={Boolean(passwordLockedUntil)}
                    aria-invalid={!!passwordErrors.currentPassword}
                  />
                  <FieldError
                    errors={passwordErrors.currentPassword?.map((message) => ({
                      message,
                    }))}
                  />
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
                    disabled={Boolean(passwordLockedUntil)}
                    aria-invalid={!!passwordErrors.newPassword}
                  />
                  <FieldError
                    errors={passwordErrors.newPassword?.map((message) => ({
                      message,
                    }))}
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
                    disabled={Boolean(passwordLockedUntil)}
                    aria-invalid={!!passwordErrors.confirmPassword}
                  />
                  <FieldError
                    errors={passwordErrors.confirmPassword?.map((message) => ({
                      message,
                    }))}
                  />
                </Field>

                <FieldError
                  errors={passwordErrors.form?.map((message) => ({ message }))}
                />
              </FieldGroup>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-violet-600 text-white hover:bg-violet-500"
                  disabled={passwordSaving || Boolean(passwordLockedUntil)}
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
                {passwordSaved && (
                  <p className="text-sm text-emerald-400">Password updated</p>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
