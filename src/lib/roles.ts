import type { UserRole } from "@/db/schema";

export const USER_ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function canManageMembers(role: UserRole) {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Project access approvals:
 * - Admins can approve anyone (including managers)
 * - Managers can only approve members
 */
export function canApproveProjectAccess(
  actorRole: UserRole,
  requesterRole: UserRole,
) {
  if (actorRole === "ADMIN") return true;
  if (actorRole === "MANAGER") return requesterRole === "MEMBER";
  return false;
}

/** Who can revoke a given target member. */
export function canRevokeMember(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "ADMIN") {
    return targetRole !== "ADMIN";
  }
  if (actorRole === "MANAGER") {
    return targetRole === "MEMBER";
  }
  return false;
}
