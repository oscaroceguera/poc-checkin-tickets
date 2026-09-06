import { z } from "zod";
import { prisma } from "@/lib/prisma";

export interface CheckinTicketInput {
  registrationSheetId: string;
  day: 1 | 2;
}

export interface CheckedInRegistrationSheet {
  id: string;
  registeredDay1: boolean;
  registeredDay2: boolean;
  onboarding: boolean;
}

export type CheckinTicketResult =
  | {
      ok: true;
      outcome: "checked-in";
      transferred: boolean;
      registrationSheet: CheckedInRegistrationSheet;
    }
  | {
      ok: true;
      outcome: "already-registered-today";
      transferred: boolean;
      registrationSheet: CheckedInRegistrationSheet;
    }
  | { ok: false; error: "invalid-input"; fieldErrors: Record<string, string> }
  | { ok: false; error: "ticket-not-found" }
  | { ok: false; error: "user-not-found" }
  | { ok: false; error: "unknown-error" };

interface RegistrationSheetWithTicket {
  id: string;
  registeredDay1: boolean;
  registeredDay2: boolean;
  onboarding: boolean;
  ticket: {
    id: string;
    user: { id: string; email: string; fullName: string | null } | null;
  };
}

interface CheckinTicketTransaction {
  registrationSheet: {
    findUnique(args: {
      where: { id: string };
      include: { ticket: { include: { user: true } } };
    }): Promise<RegistrationSheetWithTicket | null>;
    update(args: {
      where: { id: string };
      data: { registeredDay1: true } | { registeredDay2: true };
    }): Promise<CheckedInRegistrationSheet>;
  };
  ticketTransfer: {
    findFirst(args: {
      where: { originalTicketId: string };
    }): Promise<{ id: string } | null>;
  };
}

interface CheckinTicketPrismaClient {
  $transaction<T>(fn: (tx: CheckinTicketTransaction) => Promise<T>): Promise<T>;
}

export interface CheckinTicketDeps {
  prisma: CheckinTicketPrismaClient;
}

const checkinTicketSchema = z.object({
  registrationSheetId: z.string().min(1, "Registration sheet id is required"),
  day: z.union([z.literal(1), z.literal(2)], {
    error: () => "Day must be 1 or 2",
  }),
});

function validate(input: CheckinTicketInput): Record<string, string> {
  const result = checkinTicketSchema.safeParse(input);
  if (result.success) return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(
    result.error.flatten().fieldErrors,
  )) {
    if (messages?.[0]) fieldErrors[field] = messages[0];
  }
  return fieldErrors;
}

type CheckinOutcome =
  | {
      kind: "checked-in";
      transferred: boolean;
      registrationSheet: CheckedInRegistrationSheet;
    }
  | {
      kind: "already-registered-today";
      transferred: boolean;
      registrationSheet: CheckedInRegistrationSheet;
    }
  | { kind: "ticket-not-found" }
  | { kind: "user-not-found" };

export async function checkinTicket(
  input: CheckinTicketInput,
  deps: CheckinTicketDeps = { prisma },
): Promise<CheckinTicketResult> {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "invalid-input", fieldErrors };
  }

  try {
    const outcome = await deps.prisma.$transaction(
      async (tx): Promise<CheckinOutcome> => {
        const sheet = await tx.registrationSheet.findUnique({
          where: { id: input.registrationSheetId },
          include: { ticket: { include: { user: true } } },
        });
        if (!sheet) return { kind: "ticket-not-found" };
        if (!sheet.ticket.user) return { kind: "user-not-found" };

        const existingTransfer = await tx.ticketTransfer.findFirst({
          where: { originalTicketId: sheet.ticket.id },
        });
        const transferred = existingTransfer !== null;

        const alreadyRegisteredToday =
          input.day === 1 ? sheet.registeredDay1 : sheet.registeredDay2;
        if (alreadyRegisteredToday) {
          return {
            kind: "already-registered-today",
            transferred,
            registrationSheet: {
              id: sheet.id,
              registeredDay1: sheet.registeredDay1,
              registeredDay2: sheet.registeredDay2,
              onboarding: sheet.onboarding,
            },
          };
        }

        const registrationSheet = await tx.registrationSheet.update({
          where: { id: sheet.id },
          data:
            input.day === 1
              ? { registeredDay1: true }
              : { registeredDay2: true },
        });

        return { kind: "checked-in", transferred, registrationSheet };
      },
    );

    if (outcome.kind === "ticket-not-found") {
      return { ok: false, error: "ticket-not-found" };
    }
    if (outcome.kind === "user-not-found") {
      return { ok: false, error: "user-not-found" };
    }
    return {
      ok: true,
      outcome: outcome.kind,
      transferred: outcome.transferred,
      registrationSheet: outcome.registrationSheet,
    };
  } catch {
    return { ok: false, error: "unknown-error" };
  }
}
