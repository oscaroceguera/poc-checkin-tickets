import { z } from "zod";
import { prisma } from "@/lib/prisma";

export interface TransferTicketInput {
  originalTicketId: string;
  newUserEmail: string;
  newUserFullName?: string;
}

export interface TransferredTicket {
  originalTicketId: string;
  user: { id: string; email: string; fullName: string | null };
  ticket: { id: string; ticketType: string };
  registrationSheet: {
    id: string;
    registeredDay1: boolean;
    registeredDay2: boolean;
    onboarding: boolean;
  };
}

export type TransferTicketResult =
  | { ok: true; transfer: TransferredTicket }
  | { ok: false; error: "invalid-input"; fieldErrors: Record<string, string> }
  | { ok: false; error: "ticket-not-found" }
  | { ok: false; error: "already-transferred" }
  | { ok: false; error: "unknown-error" };

interface OriginalTicket {
  id: string;
  ticketType: string;
  orderId: string | null;
  paymenIntent: string;
  paymentId: string;
  registration: { event: number } | null;
}

interface TransferTicketTransaction {
  ticket: {
    findUnique(args: {
      where: { id: string };
      include: { registration: true };
    }): Promise<OriginalTicket | null>;
    create(args: {
      data: {
        ticketType: string;
        paymenIntent: string;
        paymentId: string;
        userId: string;
        orderId?: string;
      };
    }): Promise<{ id: string; ticketType: string }>;
  };
  ticketTransfer: {
    findFirst(args: {
      where: { originalTicketId: string };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: { originalTicketId: string; transferredTicketId: string };
    }): Promise<{ id: string }>;
  };
  user: {
    findFirst(args: {
      where: { email: string; ticket: null };
    }): Promise<{ id: string; email: string; fullName: string | null } | null>;
    create(args: {
      data: { email: string; fullName?: string };
    }): Promise<{ id: string; email: string; fullName: string | null }>;
  };
  registrationSheet: {
    create(args: { data: { ticketId: string; event: number } }): Promise<{
      id: string;
      registeredDay1: boolean;
      registeredDay2: boolean;
      onboarding: boolean;
    }>;
  };
}

interface TransferTicketPrismaClient {
  $transaction<T>(
    fn: (tx: TransferTicketTransaction) => Promise<T>,
  ): Promise<T>;
}

export interface TransferTicketDeps {
  prisma: TransferTicketPrismaClient;
}

const transferTicketSchema = z.object({
  originalTicketId: z.string().min(1, "Original ticket id is required"),
  newUserEmail: z
    .string()
    .min(1, "Email is required")
    .email("Email is not valid"),
  newUserFullName: z.string().optional(),
});

function validate(input: TransferTicketInput): Record<string, string> {
  const result = transferTicketSchema.safeParse(input);
  if (result.success) return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(
    result.error.flatten().fieldErrors,
  )) {
    if (messages?.[0]) fieldErrors[field] = messages[0];
  }
  return fieldErrors;
}

type TransferOutcome =
  | { kind: "ok"; transfer: TransferredTicket }
  | { kind: "ticket-not-found" }
  | { kind: "already-transferred" };

export async function transferTicket(
  input: TransferTicketInput,
  deps: TransferTicketDeps = { prisma },
): Promise<TransferTicketResult> {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "invalid-input", fieldErrors };
  }

  try {
    const outcome = await deps.prisma.$transaction(
      async (tx): Promise<TransferOutcome> => {
        const originalTicket = await tx.ticket.findUnique({
          where: { id: input.originalTicketId },
          include: { registration: true },
        });
        if (!originalTicket) return { kind: "ticket-not-found" };

        const existingTransfer = await tx.ticketTransfer.findFirst({
          where: { originalTicketId: input.originalTicketId },
        });
        if (existingTransfer) return { kind: "already-transferred" };

        const user =
          (await tx.user.findFirst({
            where: { email: input.newUserEmail, ticket: null },
          })) ??
          (await tx.user.create({
            data: {
              email: input.newUserEmail,
              fullName: input.newUserFullName,
            },
          }));

        const ticket = await tx.ticket.create({
          data: {
            ticketType: originalTicket.ticketType,
            paymenIntent: originalTicket.paymenIntent,
            paymentId: originalTicket.paymentId,
            userId: user.id,
            orderId: originalTicket.orderId ?? undefined,
          },
        });

        const registrationSheet = await tx.registrationSheet.create({
          data: {
            ticketId: ticket.id,
            event: originalTicket.registration?.event ?? 0,
          },
        });

        await tx.ticketTransfer.create({
          data: {
            originalTicketId: input.originalTicketId,
            transferredTicketId: ticket.id,
          },
        });

        return {
          kind: "ok",
          transfer: {
            originalTicketId: input.originalTicketId,
            user,
            ticket,
            registrationSheet,
          },
        };
      },
    );

    if (outcome.kind === "ticket-not-found") {
      return { ok: false, error: "ticket-not-found" };
    }
    if (outcome.kind === "already-transferred") {
      return { ok: false, error: "already-transferred" };
    }
    return { ok: true, transfer: outcome.transfer };
  } catch {
    return { ok: false, error: "unknown-error" };
  }
}
