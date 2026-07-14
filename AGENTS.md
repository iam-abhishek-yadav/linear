# Agent guide — Mini Linear

Source of truth for AI agents working in this repository. Read this before making changes.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This project uses **Next.js 16** with breaking changes from earlier versions. APIs, conventions, and file structure may differ from your training data.

**Before writing Next.js code**, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this project is

**Mini Linear** is a multi-tenant task board (Linear-inspired) built with Next.js 16 App Router, PostgreSQL, and Drizzle ORM. Each organization is an isolated workspace. Users collaborate on tasks with kanban/list views, comments, activity history, and in-app notifications.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system diagrams, data model, and request flows.

## Quick start (local dev)

```bash
npm install
cp .env.example .env          # set DATABASE_URL, APP_URL
npm run db:up               # Postgres on port 5433
npm run db:migrate
npm run invite:create-org   # required before first signup
npm run dev
```

## Directory layout

```
src/
├── app/
│   ├── (auth)/              Login, register, join — public pages
│   ├── (app)/               Protected app shell + settings
│   │   ├── (workspace-issues)/   /list, /active, /backlog, /completed
│   │   ├── (my-issues-tab)/      /my-issues
│   │   ├── board/                Kanban
│   │   ├── inbox/                Notifications
│   │   ├── issues/               Issue detail overlay (/issues/[id])
│   │   └── settings/             Workspace + members (admin)
│   └── api/                 REST route handlers
├── components/
│   ├── ui/                  shadcn primitives
│   ├── kanban/              Board + drag-and-drop
│   ├── list/                List views
│   ├── issues/              Issue detail, comments, activity
│   ├── inbox/               Notification inbox
│   ├── settings/            Members management
│   └── *-provider.tsx       React context + TanStack Query
├── db/schema.ts             Drizzle schema (single source of truth for DB types)
├── hooks/                   Client hooks (thin wrappers)
└── lib/                     Server logic, auth, API client, domain helpers
drizzle/                     Generated SQL migrations
scripts/                     migrate.mjs, create-org-invite.ts, docker-entrypoint.sh
```

## Data model

Always check `src/db/schema.ts` before assuming table/column names.

| Table | Notes |
|-------|-------|
| `Organization` | Workspace; unique `slug` |
| `User` | Belongs to one org; `role`: `ADMIN` \| `MANAGER` \| `MEMBER` |
| `Session` | Server-side session; cookie stores id only |
| `Task` | Org-scoped; `status`, `priority`, `position`, `assigneeId` |
| `TaskActivity` | Audit log for task changes |
| `TaskComment` | Comments on tasks |
| `Notification` | In-app: `ASSIGNED`, `COMMENT`, `STATUS_CHANGED` |
| `OrgInvite` | Bootstrap new organization |
| `MemberInvite` | Join existing organization |

**Tenancy rule**: every task/member query must scope to `session.organization.id`. Use `getOrganizationTask()` and `isAssigneeInOrganization()` from `src/lib/task-access.ts`.

## Authentication

Custom sessions — **not** NextAuth, Clerk, or JWT in cookies.

| File | Role |
|------|------|
| `src/lib/auth.ts` | `getCurrentUser`, `createSession`, `requireUser`, `requireAdmin` |
| `src/lib/auth-constants.ts` | `SESSION_COOKIE` name |
| `src/middleware.ts` | Public vs protected routes and APIs |

- Sessions: 30-day TTL, httpOnly cookie, bcrypt passwords (cost 12)
- `getCurrentUser()` is wrapped in React `cache()` — safe to call multiple times per request
- **No open registration** — org signup requires an `OrgInvite` token (CLI-created)
- Member signup requires a `MemberInvite` token (admin UI)

### Public routes

Pages: `/`, `/login`, `/register`, `/join/*`

APIs: `/api/auth/*`, `/api/invites/*`, `/api/members/invites/*` (token endpoints), `/api/health`

Everything else requires the session cookie (middleware) plus `requireUser()` in handlers.

## Invites

| Type | How created | URL | Creates |
|------|-------------|-----|---------|
| Org | `npm run invite:create-org [--email=x]` | `/register/[token]` | Org + admin user |
| Member | Admin at `/settings/members` | `/join/[token]` | Member in org |

- Links use `APP_URL` from env (`src/lib/env.ts`)
- Links are logged to console / copied manually — email (Resend) not yet implemented
- Invite logic: `src/lib/invites.ts`, `src/lib/member-invites.ts`, `src/lib/invite-utils.ts`

## Frontend patterns

### Protected layout data loading

`(app)/layout.tsx` server-loads session, members, tasks, notifications and seeds providers:

`QueryProvider` → `SessionProvider` → `MembersProvider` → `TasksProvider` → `NotificationsProvider` → `AppShell`

### Client state

- **TanStack Query** for server state; keys in `src/lib/query-keys.ts`
- **Context providers** expose mutations (`useTasks`, `useMembers`, etc.)
- **API client**: `src/lib/api.ts` — all client fetch helpers go here
- After task changes affecting detail view, use `revalidateIssueCaches()` from `src/lib/revalidate-issue.ts`

### UI

- Single `AppSidebar` (`src/components/app-sidebar.tsx`) — nav, settings links, user info, logout
- Dark theme, Tailwind 4, shadcn/ui in `src/components/ui/`
- Kanban DnD: `@dnd-kit` via `KanbanBoard` + `persistReorder()`
- Issue detail: client layout at `src/app/(app)/issues/layout.tsx` intercepts `/issues/[id]`

### Task visibility

`src/lib/task-visibility.ts` — `DONE` tasks older than 24h are filtered from main views and shown on `/completed`.

## API route conventions

Follow existing handlers (e.g. `src/app/api/tasks/route.ts`):

1. Export handlers wrapped with `withApiRoute("name", handler)` from `src/lib/logger.ts`
2. Call `requireUser()` or `requireAdmin()` — return 401 if null
3. Validate body with Zod schemas from `src/lib/validations.ts`
4. Scope all DB reads/writes to the user's organization
5. Use transactions when writing task + activity + notifications together
6. Return `NextResponse.json(...)`

Admin-only: org rename/delete (`/settings/workspace`), member role changes. Admin or Manager: member invite/revoke (`/settings/members`, `/api/members/*`).

## Database workflow

After **any** schema change in `src/db/schema.ts`:

```bash
npm run db:generate    # creates SQL in drizzle/
npm run db:migrate     # applies migrations — never skip
```

- `src/lib/db.ts` uses a lazy Proxy so `next build` works without `DATABASE_URL`
- Use `withDbRetry()` for transient connection errors on critical reads
- If migrating an existing DB manually, run `npm run db:baseline` once to sync Drizzle's journal

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_URL` | Yes (prod) | Public URL for invite links (default `http://localhost:3000`) |
| `NODE_ENV` | Auto | `development` \| `production` |
| `LOG_LEVEL` | No | `debug` \| `info` \| `warn` \| `error` |

Validated in `src/lib/env.ts`. Never commit `.env`.

## Logging

`src/lib/logger.ts` — use `logServerCall`, `logPageRender`, `withApiRoute` for timed, structured logs. Do not add ad-hoc `console.log` in server code unless debugging briefly.

## Key files reference

| Concern | File |
|---------|------|
| Schema | `src/db/schema.ts` |
| Auth | `src/lib/auth.ts`, `src/middleware.ts` |
| Task queries | `src/lib/tasks.ts` |
| Task mutations / activity | `src/app/api/tasks/*`, `src/lib/task-activity.ts` |
| Notifications | `src/lib/notifications.ts` |
| Members | `src/lib/members.ts`, `src/lib/member-invites.ts` |
| Registration | `src/lib/registration.ts` |
| Constants (statuses, columns) | `src/lib/constants.ts` |
| Types (re-exports) | `src/lib/types.ts` |
| Validations | `src/lib/validations.ts` |

## When unsure

1. Read the nearest similar file and match its patterns
2. Check `src/db/schema.ts` for the data model
3. Check `src/middleware.ts` for public vs protected routes
4. Check `ARCHITECTURE.md` for how pieces connect
5. Run `npm run db:migrate` after schema changes

## Do not

- Commit `.env` or secrets
- Use open registration — org signup requires an invite token
- Add NextAuth, Clerk, or other auth libraries without explicit request
- Skip migrations after schema changes
- Query tasks without org scoping
- Assume Next.js 14/15 APIs — verify against Next.js 16 docs in `node_modules/next/dist/docs/`

## Scripts

| Command | Use |
|---------|-----|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | Postgres container |
| `npm run db:generate` | Generate migration after schema edit |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run invite:create-org` | Create org invite |
| `npm run docker:prod` | Full Docker stack |
