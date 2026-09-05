# Validation — Foundation Setup

## Done / mergeable when

- [x] `pnpm prisma migrate dev` applies cleanly against the provisioned Neon database with no errors
- [x] `prisma/schema.prisma` matches the five model blocks in `requirements.md` (User, Order, Ticket, RegistrationSheet, TicketTransfer) with no unintended changes
- [x] `lib/prisma.ts` exists and is the only place a `PrismaClient` is constructed
- [x] `pnpm build` succeeds
- [x] `pnpm lint` is clean
- [x] `package.json` has a `test` script and `pnpm test` executes successfully (even with no test files yet)
- [x] `DATABASE_URL` is present as an env var (via `vercel env pull` or `.env`) and not committed to git

## Explicitly not required for this phase

- No `lib/tickets/*` unit tests yet — those land with Phase 1 per `specs/roadmap.md`
- No UI or route changes to verify
- No seed data to check
