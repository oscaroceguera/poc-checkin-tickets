import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export interface GenerateTicketInput {
  email: string;
  fullName?: string;
  buyer?: string;
  event: number;
}

export interface GeneratedTicket {
  order: { id: string; checkoutSessionId: string };
  user: { id: string; email: string; fullName: string | null };
  ticket: { id: string; ticketType: string };
  registrationSheet: {
    id: string;
    registeredDay1: boolean;
    registeredDay2: boolean;
    onboarding: boolean;
  };
  qrDataUrl: string;
}

export type GenerateTicketResult =
  | { ok: true; ticket: GeneratedTicket }
  | { ok: false; error: "invalid-input"; fieldErrors: Record<string, string> }
  | { ok: false; error: "duplicate-order" }
  | { ok: false; error: "unknown-error" };

interface GenerateTicketTransaction {
  order: {
    create(args: {
      data: {
        checkoutSessionId: string;
        ticketTypeSale: string;
        buyer?: string;
      };
    }): Promise<{ id: string; checkoutSessionId: string }>;
  };
  user: {
    create(args: {
      data: { email: string; fullName?: string; orderId: string };
    }): Promise<{ id: string; email: string; fullName: string | null }>;
  };
  ticket: {
    create(args: {
      data: {
        ticketType: string;
        paymenIntent: string;
        paymentId: string;
        userId: string;
        orderId: string;
      };
    }): Promise<{ id: string; ticketType: string }>;
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

interface GenerateTicketPrismaClient {
  $transaction<T>(
    fn: (tx: GenerateTicketTransaction) => Promise<T>,
  ): Promise<T>;
}

export interface GenerateTicketDeps {
  prisma: GenerateTicketPrismaClient;
}

const TICKET_TYPE_SALE = "NORMAL";
const TICKET_TYPE = "EARLY-BIRD";

const generateTicketSchema = z.object({
  email: z.string().min(1, "Email is required").email("Email is not valid"),
  fullName: z.string().optional(),
  buyer: z.string().optional(),
  event: z
    .number({ error: () => "Event must be an integer" })
    .int("Event must be an integer"),
});

function validate(input: GenerateTicketInput): Record<string, string> {
  const result = generateTicketSchema.safeParse(input);
  if (result.success) return {};

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(
    result.error.flatten().fieldErrors,
  )) {
    if (messages?.[0]) fieldErrors[field] = messages[0];
  }
  return fieldErrors;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

export async function generateTicket(
  input: GenerateTicketInput,
  deps: GenerateTicketDeps = { prisma },
): Promise<GenerateTicketResult> {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "invalid-input", fieldErrors };
  }

  const checkoutSessionId = crypto.randomUUID();
  const paymenIntent = crypto.randomUUID();
  const paymentId = crypto.randomUUID();

  try {
    const ticket = await deps.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          checkoutSessionId,
          ticketTypeSale: TICKET_TYPE_SALE,
          buyer: input.buyer,
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          orderId: order.id,
        },
      });

      const createdTicket = await tx.ticket.create({
        data: {
          ticketType: TICKET_TYPE,
          paymenIntent,
          paymentId,
          userId: user.id,
          orderId: order.id,
        },
      });

      const registrationSheet = await tx.registrationSheet.create({
        data: { ticketId: createdTicket.id, event: input.event },
      });

      const qrDataUrl = await QRCode.toDataURL(registrationSheet.id);

      return {
        order,
        user,
        ticket: createdTicket,
        registrationSheet,
        qrDataUrl,
      };
    });

    return { ok: true, ticket };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "duplicate-order" };
    }
    return { ok: false, error: "unknown-error" };
  }
}
