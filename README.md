# Mini Linear

A lightweight task board inspired by Linear. Phase 1 includes task CRUD and a kanban board — no auth yet.

## Stack

- **Next.js 16** (App Router)
- **PostgreSQL** via Docker
- **Drizzle ORM** + **drizzle-kit**
- **shadcn/ui** (dark mode only)
- **@dnd-kit** for drag-and-drop

## Getting started

### 1. Start the database

```bash
npm run db:up
```

Postgres runs on port **5433** (5432 is often taken locally).

### 2. Run migrations

```bash
npm run db:migrate
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features (Phase 1)

- Create, edit, and delete tasks
- Kanban board with 4 columns: Backlog, Todo, In Progress, Done
- Drag-and-drop to reorder tasks and move between columns
- Priority levels: None, Low, Medium, High, Urgent

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop Postgres container |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Environment

Copy `.env.example` to `.env`:

```
DATABASE_URL="postgresql://linear:linear@localhost:5433/mini_linear?schema=public"
```

## Roadmap

- [ ] Authentication
- [ ] Teams & projects
- [ ] Issue identifiers (LIN-123)
- [ ] Comments & activity
