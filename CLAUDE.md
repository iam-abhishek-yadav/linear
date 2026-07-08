@AGENTS.md

# Claude notes

Read `AGENTS.md` first — it is the source of truth for this repo.

## Before writing Next.js code

This project uses **Next.js 16** with breaking changes from earlier versions. Check `node_modules/next/dist/docs/` for current APIs before implementing routing, data fetching, or config.

## Quick orientation

- **Auth**: custom sessions, not NextAuth/Clerk — see `src/lib/auth.ts`
- **Invites**: org (CLI) + member (admin UI); links copied manually until Resend is added
- **Sidebars**: `AppShell` swaps app sidebar ↔ settings sidebar on `/settings/*`
- **Admin actions**: member invite, revoke member, revoke pending invite — all on `/settings/members`

## When unsure

1. Read the nearest similar file and follow its patterns
2. Check `src/db/schema.ts` before assuming data model
3. Check `src/middleware.ts` for public vs protected routes
4. Run `npm run db:migrate` after schema changes, never skip migrations

## Do not

- Commit `.env` or secrets
- Use open registration — org signup requires an invite token
- Create nested settings sidebars — settings replaces the main sidebar
