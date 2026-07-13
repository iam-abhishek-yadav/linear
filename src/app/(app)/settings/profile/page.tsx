import { ProfilePage } from "@/components/settings/profile-page";
import { getCurrentUser } from "@/lib/auth";
import { getPasswordChangeRetryAt } from "@/lib/password-reset";

export default async function SettingsProfilePage() {
  const session = await getCurrentUser();

  if (!session) {
    return null;
  }

  const passwordChangeRetryAt = getPasswordChangeRetryAt(
    session.user.passwordChangedAt,
  );

  return (
    <ProfilePage
      initialProfile={{
        name: session.user.name,
        email: session.user.email,
        passwordChangeRetryAt: passwordChangeRetryAt?.toISOString() ?? null,
      }}
    />
  );
}
