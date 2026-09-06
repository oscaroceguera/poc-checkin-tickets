import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type TransferTicketDeps,
  type TransferTicketInput,
  transferTicket,
} from "./transfer";

const validInput: TransferTicketInput = {
  originalTicketId: "ticket-1",
  newUserEmail: "newattendee@example.com",
  newUserFullName: "Grace Hopper",
};

interface OriginalTicketFixture {
  id: string;
  ticketType: string;
  orderId: string | null;
  paymenIntent: string;
  paymentId: string;
  registration: { event: number } | null;
}

function createFakeDeps(options?: {
  originalTicket?: OriginalTicketFixture | null;
  existingTransfer?: { id: string } | null;
  existingTicketlessUser?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}): TransferTicketDeps & {
  calls: { model: string; op: string; data?: unknown }[];
} {
  const calls: { model: string; op: string; data?: unknown }[] = [];

  const originalTicket: OriginalTicketFixture | null =
    options?.originalTicket !== undefined
      ? options.originalTicket
      : {
          id: "ticket-1",
          ticketType: "EARLY-BIRD",
          orderId: "order-1",
          paymenIntent: "intent-1",
          paymentId: "payment-1",
          registration: { event: 1 },
        };

  const existingTransfer = options?.existingTransfer ?? null;
  const existingTicketlessUser = options?.existingTicketlessUser ?? null;

  const tx = {
    ticket: {
      findUnique: vi.fn(async () => {
        calls.push({ model: "ticket", op: "findUnique" });
        return originalTicket;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "ticket", op: "create", data });
        return { id: "new-ticket-1", ticketType: data.ticketType as string };
      }),
    },
    ticketTransfer: {
      findFirst: vi.fn(async () => {
        calls.push({ model: "ticketTransfer", op: "findFirst" });
        return existingTransfer;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "ticketTransfer", op: "create", data });
        return { id: "transfer-1" };
      }),
    },
    user: {
      findFirst: vi.fn(async () => {
        calls.push({ model: "user", op: "findFirst" });
        return existingTicketlessUser;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "user", op: "create", data });
        return {
          id: "new-user-1",
          email: data.email as string,
          fullName: (data.fullName as string | undefined) ?? null,
        };
      }),
    },
    registrationSheet: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "registrationSheet", op: "create", data });
        return {
          id: "new-sheet-1",
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

describe("transferTicket", () => {
  it("creates a new user, ticket, registration sheet, and transfer link for a brand-new email", async () => {
    const deps = createFakeDeps();

    const result = await transferTicket(validInput, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    expect(result.transfer.originalTicketId).toBe("ticket-1");
    expect(result.transfer.user.id).toBe("new-user-1");
    expect(result.transfer.ticket.id).toBe("new-ticket-1");
    expect(result.transfer.registrationSheet.id).toBe("new-sheet-1");

    const userCreate = deps.calls.find(
      (c) => c.model === "user" && c.op === "create",
    )?.data as Record<string, unknown>;
    expect(userCreate.email).toBe(validInput.newUserEmail);
    expect(userCreate.fullName).toBe(validInput.newUserFullName);

    const ticketCreate = deps.calls.find(
      (c) => c.model === "ticket" && c.op === "create",
    )?.data as Record<string, unknown>;
    expect(ticketCreate.ticketType).toBe("EARLY-BIRD");
    expect(ticketCreate.orderId).toBe("order-1");
    expect(ticketCreate.paymenIntent).toBe("intent-1");
    expect(ticketCreate.paymentId).toBe("payment-1");
    expect(ticketCreate.userId).toBe("new-user-1");

    const sheetCreate = deps.calls.find(
      (c) => c.model === "registrationSheet" && c.op === "create",
    )?.data as Record<string, unknown>;
    expect(sheetCreate.ticketId).toBe("new-ticket-1");
    expect(sheetCreate.event).toBe(1);

    const transferCreate = deps.calls.find(
      (c) => c.model === "ticketTransfer" && c.op === "create",
    )?.data as Record<string, unknown>;
    expect(transferCreate.originalTicketId).toBe("ticket-1");
    expect(transferCreate.transferredTicketId).toBe("new-ticket-1");
  });

  it("sets the new registration sheet's day flags to false regardless of the original's state", async () => {
    const deps = createFakeDeps();

    const result = await transferTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(result.transfer.registrationSheet.registeredDay1).toBe(false);
    expect(result.transfer.registrationSheet.registeredDay2).toBe(false);
    expect(result.transfer.registrationSheet.onboarding).toBe(false);
  });

  it("reuses an existing ticketless user matching the new email instead of creating a duplicate", async () => {
    const deps = createFakeDeps({
      existingTicketlessUser: {
        id: "user-existing-1",
        email: validInput.newUserEmail,
        fullName: "Grace Hopper",
      },
    });

    const result = await transferTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(result.transfer.user.id).toBe("user-existing-1");
    expect(
      deps.calls.find((c) => c.model === "user" && c.op === "create"),
    ).toBeUndefined();
  });

  it("returns ticket-not-found when the original ticket id does not match any ticket, without writing", async () => {
    const deps = createFakeDeps({ originalTicket: null });

    const result = await transferTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "ticket-not-found" });
    expect(deps.calls.some((c) => c.op === "create")).toBe(false);
  });

  it("returns already-transferred when a TicketTransfer already exists for this ticket, without writing", async () => {
    const deps = createFakeDeps({
      existingTransfer: { id: "transfer-existing" },
    });

    const result = await transferTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "already-transferred" });
    expect(deps.calls.some((c) => c.op === "create")).toBe(false);
  });

  it("returns an invalid-input error when originalTicketId is missing, without touching the database", async () => {
    const deps = createFakeDeps();

    const result = await transferTicket(
      { ...validInput, originalTicketId: "" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "invalid-input",
      fieldErrors: { originalTicketId: "Original ticket id is required" },
    });
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns an invalid-input error when newUserEmail is malformed", async () => {
    const deps = createFakeDeps();

    const result = await transferTicket(
      { ...validInput, newUserEmail: "not-an-email" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "invalid-input",
      fieldErrors: { newUserEmail: "Email is not valid" },
    });
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns an unknown-error result for unexpected database failures", async () => {
    const deps = createFakeDeps();
    deps.prisma.$transaction = vi.fn(async () => {
      throw new Error("connection reset");
    });

    const result = await transferTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "unknown-error" });
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
