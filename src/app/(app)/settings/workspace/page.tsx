import { getCurrentUser } from "@/lib/auth";
import { getAvatarColor, getInitials } from "@/lib/user-utils";

export default async function WorkspaceSettingsPage() {
  const session = await getCurrentUser();

  if (!session) {
    return null;
  }

  const { organization } = session;
  const initials = getInitials(organization.name);
  const avatarColor = getAvatarColor(organization.name);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/40 px-8 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>
      </div>
      <div className="space-y-6 px-8 py-6">
        <div className="flex items-center gap-4">
          <span
            className={`flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarColor}`}
          >
            {initials}
          </span>
          <div>
            <p className="text-lg font-medium">{organization.name}</p>
            <p className="text-sm text-muted-foreground">{organization.slug}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
