# Tech Stack

## In use

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Single framework for both admin UI and API/server actions |
| UI | React 19 | Component model, Server Components by default |
| Language | TypeScript (strict mode) | Compile-time safety for the data model and business rules |
| Styling | Tailwind CSS v4 | Utility-first styling, minimal custom CSS |
| Lint/format | Biome | Faster, single tool instead of ESLint + Prettier |
| Package manager | pnpm | Project standard (see `pnpm-workspace.yaml`) |
| Form validation | Zod | Schema-based validation for form/input data, shared between client and server |

## Not yet installed

| Layer | Choice | Why |
|---|---|---|
| ORM | Prisma | Specified in `requirements.md`; models schema for User/Order/Ticket/RegistrationSheet/TicketTransfer |
| Database | **PostgreSQL** | Production-realistic and fits an eventual Vercel deployment, over a local-only SQLite file |
| Test runner | Vitest | Unit-tests the pure business logic in `lib/tickets/*` without HTTP or a real database |

Install commands are in `AGENTS.md` → Setup Commands. When running `pnpm prisma init`, choose the `postgresql` provider so `prisma/schema.prisma` targets Postgres from the start.

## Architecture

Business logic stays framework-agnostic: `lib/tickets/{generate,transfer,checkin}.ts` hold pure functions with plain-data inputs/outputs, `lib/prisma.ts` is the single shared Prisma client, and `app/api/**/route.ts` (or Server Actions) are thin adapters with no business rules. Full rationale is in `AGENTS.md` → Suggested Architecture — this file only records the stack decision, not the code layout.
