# Mini Linear

A lightweight task board inspired by Linear with multi-tenant auth, org invites, and member management.

## Stack

- **Next.js 16** (App Router, standalone output)
- **PostgreSQL** + **Drizzle ORM**
- **Session-based auth** (bcrypt + httpOnly cookies)
- **shadcn/ui** + **Tailwind CSS 4**
- **@dnd-kit** for drag-and-drop

## Local development

### 1. Install dependencies

```bash
npm install
cp .env.example .env
```

### 2. Start Postgres

```bash
npm run db:up
```

Postgres runs on port **5433** by default.

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. Create an org invite (first workspace)

Registration is invite-only. Create an org invite and use the logged URL:

```bash
npm run invite:create-org
# or lock to a specific email:
npm run invite:create-org -- --email=admin@example.com
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production (Docker)

Run the full stack (Postgres + app) with migrations applied on startup:

```bash
cp .env.example .env
# Set APP_URL to your public URL, e.g. https://app.example.com
npm run docker:prod
```

Stop:

```bash
npm run docker:prod:down
```

The app container runs migrations via `scripts/migrate.mjs` before starting.

> **Note:** If you previously applied migrations manually, run `npm run db:baseline` once to sync Drizzle's migration journal before using `db:migrate`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server (run migrations first) |
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop containers |
| `npm run db:generate` | Generate Drizzle migrations after schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run invite:create-org` | Create an org registration invite |
| `npm run docker:prod` | Build and run full Docker stack |

## Environment

See `.env.example`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_URL` | Public app URL (used in invite links) |
| `NODE_ENV` | `development` or `production` |

## Features

- Kanban board with drag-and-drop
- Invite-only org registration (admin creates workspace)
- Member invites with copyable links (email via Resend — coming later)
- Settings: workspace info, members management
- Session auth with role-based access (Admin / Member)

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, join
│   ├── (app)/           # Protected app + settings
│   └── api/             # REST API routes
├── components/          # UI components
├── db/schema.ts         # Drizzle schema
└── lib/                 # Auth, invites, env, db
drizzle/                 # SQL migrations
scripts/                 # Migrate, org invite CLI, Docker entrypoint
```
