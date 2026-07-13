"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { InviteLinkCopy } from "@/components/settings/invite-link-copy";
import { InviteSendEmailButton } from "@/components/settings/invite-send-email-button";
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { useMembersPage } from "@/hooks/use-members-page";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeDate, getAvatarColor, getInitials } from "@/lib/user-utils";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  isCurrentUser: boolean;
};

type PendingInvite = {
  id: string;
  email: string;
  inviteUrl: string;
  createdAt: string;
  expiresAt: string;
};

function MemberAvatar({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white",
        getAvatarColor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}

function RoleBadge({ role }: { role: Member["role"] }) {
  if (role === "ADMIN") {
    return (
      <Badge className="h-5 rounded border-0 bg-violet-500/20 px-1.5 text-[12px] font-medium text-violet-300">
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="h-5 rounded px-1.5 text-[12px] font-medium">
      Member
    </Badge>
  );
}

export function MembersPage({
  initialMembers,
  initialPendingInvites,
}: {
  initialMembers: Member[];
  initialPendingInvites: PendingInvite[];
}) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const membersQuery = useMembersPage({
    members: initialMembers,
    pendingInvites: initialPendingInvites,
  });
  const members = membersQuery.data?.members ?? initialMembers;
  const pendingInvites =
    membersQuery.data?.pendingInvites ?? initialPendingInvites;
  const loading = membersQuery.isPending && !membersQuery.data;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<
    | { type: "member"; id: string; name: string }
    | { type: "invite"; id: string; email: string }
    | null
  >(null);
  const [revoking, setRevoking] = useState(false);

  async function refreshMembers() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.membersPage }),
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers }),
    ]);
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && member.role === "ADMIN") ||
        (roleFilter === "member" && member.role === "MEMBER");

      return matchesSearch && matchesRole;
    });
  }, [members, roleFilter, search]);

  const filteredInvites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return pendingInvites;
    }

    return pendingInvites.filter((invite) =>
      invite.email.toLowerCase().includes(query),
    );
  }, [pendingInvites, search]);

  const isAdmin = user.role === "ADMIN";

  async function handleRevoke() {
    if (!revokeTarget) {
      return;
    }

    setRevoking(true);

    const url =
      revokeTarget.type === "member"
        ? `/api/members/${revokeTarget.id}`
        : `/api/members/invites/manage/${revokeTarget.id}`;

    const response = await fetch(url, { method: "DELETE" });

    setRevoking(false);

    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "Failed to revoke access");
      return;
    }

    setRevokeTarget(null);
    await refreshMembers();
  }

  function canRevokeMember(member: Member) {
    return isAdmin && member.role === "MEMBER" && !member.isCurrentUser;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-border/40 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Members</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:min-w-48 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="h-8 w-full border-border/60 bg-black/20 pl-8 text-[14px] sm:w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value ?? "all")}
            >
              <SelectTrigger className="h-8 w-24 border-border/60 bg-black/20 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button
                size="sm"
                className="h-8 bg-violet-600 text-[14px] text-white hover:bg-violet-500"
                onClick={() => setInviteOpen(true)}
              >
                Invite
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading members...</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-[14px] font-medium text-muted-foreground">
                Active {filteredMembers.length}
              </h2>

              {/* Mobile card list */}
              <div className="space-y-2 md:hidden">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border border-border/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar name={member.name} />
                        <p className="truncate font-medium">{member.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RoleBadge role={member.role} />
                        {isAdmin && canRevokeMember(member) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                              aria-label={`Actions for ${member.name}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setRevokeTarget({
                                    type: "member",
                                    id: member.id,
                                    name: member.name,
                                  })
                                }
                              >
                                Revoke access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 truncate pl-10 text-[13px] text-muted-foreground">
                      {member.email}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                      <span>
                        Joined {formatRelativeDate(new Date(member.createdAt))}
                      </span>
                      {member.isCurrentUser && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-lg border border-border/40 md:block">
                <table className="w-full text-left text-[14px]">
                  <thead className="border-b border-border/40 bg-white/[0.02] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Email</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Joined</th>
                      <th className="px-4 py-2.5 font-medium">Last seen</th>
                      {isAdmin && <th className="px-4 py-2.5 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-border/30 last:border-b-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={member.name} />
                            <p className="font-medium">{member.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={member.role} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatRelativeDate(new Date(member.createdAt))}
                        </td>
                        <td className="px-4 py-3">
                          {member.isCurrentUser ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              Online
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            {canRevokeMember(member) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                                  aria-label={`Actions for ${member.name}`}
                                >
                                  <MoreHorizontal className="size-3.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setRevokeTarget({
                                        type: "member",
                                        id: member.id,
                                        name: member.name,
                                      })
                                    }
                                  >
                                    Revoke access
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {filteredInvites.length > 0 && (
              <section>
                <h2 className="mb-3 text-[14px] font-medium text-muted-foreground">
                  Pending {filteredInvites.length}
                </h2>

                {/* Mobile card list */}
                <div className="space-y-2 md:hidden">
                  {filteredInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-lg border border-border/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{invite.email}</p>
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className="h-5 rounded px-1.5 text-[12px] font-medium"
                            >
                              Invited
                            </Badge>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              setRevokeTarget({
                                type: "invite",
                                id: invite.id,
                                email: invite.email,
                              })
                            }
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate font-mono text-[12px] text-muted-foreground">
                          {invite.inviteUrl}
                        </span>
                        <InviteLinkCopy url={invite.inviteUrl} compact />
                        <InviteSendEmailButton inviteId={invite.id} compact />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                        <span>
                          Invited {formatRelativeDate(new Date(invite.createdAt))}
                        </span>
                        <span>
                          Expires {formatRelativeDate(new Date(invite.expiresAt))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-lg border border-border/40 md:block">
                  <table className="w-full text-left text-[14px]">
                    <thead className="border-b border-border/40 bg-white/[0.02] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Email</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Invite link</th>
                        <th className="px-4 py-2.5 font-medium">Invited</th>
                        <th className="px-4 py-2.5 font-medium">Expires</th>
                        {isAdmin && <th className="px-4 py-2.5 font-medium" />}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvites.map((invite) => (
                        <tr
                          key={invite.id}
                          className="border-b border-border/30 last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3 font-medium">{invite.email}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="h-5 rounded px-1.5 text-[12px] font-medium"
                            >
                              Invited
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex max-w-xs items-center gap-2">
                              <span className="min-w-0 truncate font-mono text-[12px] text-muted-foreground">
                                {invite.inviteUrl}
                              </span>
                              <InviteLinkCopy url={invite.inviteUrl} compact />
                              <InviteSendEmailButton inviteId={invite.id} compact />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatRelativeDate(new Date(invite.createdAt))}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatRelativeDate(new Date(invite.expiresAt))}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  setRevokeTarget({
                                    type: "invite",
                                    id: invite.id,
                                    email: invite.email,
                                  })
                                }
                              >
                                Revoke
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={refreshMembers}
      />

      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
          }
        }}
      >
        <DialogContent className="border-border/60 bg-[#1a1a1c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke access</DialogTitle>
            <DialogDescription>
              {revokeTarget?.type === "member" ? (
                <>
                  Remove <span className="text-foreground">{revokeTarget.name}</span>{" "}
                  from this workspace? They will be signed out and lose access
                  immediately.
                </>
              ) : revokeTarget?.type === "invite" ? (
                <>
                  Revoke the pending invite for{" "}
                  <span className="text-foreground">{revokeTarget.email}</span>?
                  Their invite link will stop working.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? "Revoking..." : "Revoke access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
