import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(
      async (text: string) => `data:image/png;base64,fake(${text})`,
    ),
  },
}));

import QRCode from "qrcode";
import {
  type GenerateTicketDeps,
  type GenerateTicketInput,
  generateTicket,
} from "./generate";

const validInput: GenerateTicketInput = {
  email: "attendee@example.com",
  fullName: "Ada Lovelace",
  buyer: "Ada Lovelace",
  event: 1,
};

function createFakeDeps(): GenerateTicketDeps & {
  calls: { model: string; data: unknown }[];
} {
  const calls: { model: string; data: unknown }[] = [];

  const tx = {
    order: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "order", data });
        return {
          id: "order-1",
          checkoutSessionId: data.checkoutSessionId as string,
        };
      }),
    },
    user: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "user", data });
        return {
          id: "user-1",
          email: data.email as string,
          fullName: (data.fullName as string | undefined) ?? null,
        };
      }),
    },
    ticket: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "ticket", data });
        return { id: "ticket-1", ticketType: data.ticketType as string };
      }),
    },
    registrationSheet: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "registrationSheet", data });
        return {
          id: "sheet-1",
          registeredDay1: false,
          registeredDay2: false,
          onboarding: false,
        };
      }),
    },
  };

  return {
    calls,
    prisma: {
      $transaction: vi.fn(async (fn) => fn(tx)),
    },
  };
}

beforeEach(() => {
  vi.mocked(QRCode.toDataURL).mockClear();
});

describe("generateTicket", () => {
  it("creates the order, user, ticket, and registration sheet linked to each other", async () => {
    const deps = createFakeDeps();

    const result = await generateTicket(validInput, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    expect(result.ticket.order.id).toBe("order-1");
    expect(result.ticket.user.id).toBe("user-1");
    expect(result.ticket.ticket.id).toBe("ticket-1");
    expect(result.ticket.registrationSheet.id).toBe("sheet-1");

    const userCreate = deps.calls.find((c) => c.model === "user")
      ?.data as Record<string, unknown>;
    expect(userCreate.orderId).toBe("order-1");

    const ticketCreate = deps.calls.find((c) => c.model === "ticket")
      ?.data as Record<string, unknown>;
    expect(ticketCreate.userId).toBe("user-1");
    expect(ticketCreate.orderId).toBe("order-1");

    const sheetCreate = deps.calls.find((c) => c.model === "registrationSheet")
      ?.data as Record<string, unknown>;
    expect(sheetCreate.ticketId).toBe("ticket-1");
    expect(sheetCreate.event).toBe(1);
  });

  it("encodes the RegistrationSheet id in the QR payload, not the ticket or user id", async () => {
    const deps = createFakeDeps();

    const result = await generateTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(QRCode.toDataURL).toHaveBeenCalledWith("sheet-1");
    expect(result.ticket.qrDataUrl).toBe("data:image/png;base64,fake(sheet-1)");
  });

  it("always sets Order.ticketTypeSale to NORMAL and Ticket.ticketType to EARLY-BIRD", async () => {
    const deps = createFakeDeps();

    const result = await generateTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");

    const orderCreate = deps.calls.find((c) => c.model === "order")
      ?.data as Record<string, unknown>;
    expect(orderCreate.ticketTypeSale).toBe("NORMAL");

    const ticketCreate = deps.calls.find((c) => c.model === "ticket")
      ?.data as Record<string, unknown>;
    expect(ticketCreate.ticketType).toBe("EARLY-BIRD");
  });

  it("generates distinct checkoutSessionId, paymenIntent, and paymentId across calls", async () => {
    const firstDeps = createFakeDeps();
    const secondDeps = createFakeDeps();

    const firstResult = await generateTicket(validInput, firstDeps);
    const secondResult = await generateTicket(validInput, secondDeps);

    if (!firstResult.ok || !secondResult.ok) {
      throw new Error("expected ok results");
    }

    const firstOrder = firstDeps.calls.find((c) => c.model === "order")
      ?.data as Record<string, unknown>;
    const secondOrder = secondDeps.calls.find((c) => c.model === "order")
      ?.data as Record<string, unknown>;
    const firstTicket = firstDeps.calls.find((c) => c.model === "ticket")
      ?.data as Record<string, unknown>;
    const secondTicket = secondDeps.calls.find((c) => c.model === "ticket")
      ?.data as Record<string, unknown>;

    expect(firstOrder.checkoutSessionId).toBeTruthy();
    expect(firstTicket.paymenIntent).toBeTruthy();
    expect(firstTicket.paymentId).toBeTruthy();

    expect(firstOrder.checkoutSessionId).not.toBe(
      secondOrder.checkoutSessionId,
    );
    expect(firstTicket.paymenIntent).not.toBe(secondTicket.paymenIntent);
    expect(firstTicket.paymentId).not.toBe(secondTicket.paymentId);
  });

  it("returns an invalid-input error when email is missing, without touching the database", async () => {
    const deps = createFakeDeps();

    const result = await generateTicket({ ...validInput, email: "" }, deps);

    expect(result).toEqual({
      ok: false,
      error: "invalid-input",
      fieldErrors: { email: "Email is required" },
    });
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns an invalid-input error when email is malformed", async () => {
    const deps = createFakeDeps();

    const result = await generateTicket(
      { ...validInput, email: "not-an-email" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "invalid-input",
      fieldErrors: { email: "Email is not valid" },
    });
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns a duplicate-order error when checkoutSessionId already exists", async () => {
    const deps = createFakeDeps();
    deps.prisma.$transaction = vi.fn(async () => {
      throw Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });
    });

    const result = await generateTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "duplicate-order" });
  });

  it("returns an unknown-error result for unexpected database failures", async () => {
    const deps = createFakeDeps();
    deps.prisma.$transaction = vi.fn(async () => {
      throw new Error("connection reset");
    });

    const result = await generateTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "unknown-error" });
  });
});
