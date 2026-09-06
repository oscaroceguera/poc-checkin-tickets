import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type CheckinTicketDeps,
  type CheckinTicketInput,
  checkinTicket,
} from "./checkin";

const validInput: CheckinTicketInput = {
  registrationSheetId: "sheet-1",
  day: 1,
};

interface RegistrationSheetFixture {
  id: string;
  registeredDay1: boolean;
  registeredDay2: boolean;
  onboarding: boolean;
  ticket: {
    id: string;
    user: { id: string; email: string; fullName: string | null } | null;
  };
}

function createFakeDeps(options?: {
  registrationSheet?: RegistrationSheetFixture | null;
  existingTransfer?: { id: string } | null;
}): CheckinTicketDeps & {
  calls: { model: string; op: string; data?: unknown }[];
} {
  const calls: { model: string; op: string; data?: unknown }[] = [];

  const registrationSheet: RegistrationSheetFixture | null =
    options?.registrationSheet !== undefined
      ? options.registrationSheet
      : {
          id: "sheet-1",
          registeredDay1: false,
          registeredDay2: false,
          onboarding: false,
          ticket: {
            id: "ticket-1",
            user: {
              id: "user-1",
              email: "attendee@example.com",
              fullName: "Ada Lovelace",
            },
          },
        };

  const existingTransfer = options?.existingTransfer ?? null;

  const tx = {
    registrationSheet: {
      findUnique: vi.fn(async () => {
        calls.push({ model: "registrationSheet", op: "findUnique" });
        return registrationSheet;
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ model: "registrationSheet", op: "update", data });
        return {
          id: registrationSheet?.id ?? "sheet-1",
          registeredDay1:
            (data.registeredDay1 as boolean | undefined) ??
            registrationSheet?.registeredDay1 ??
            false,
          registeredDay2:
            (data.registeredDay2 as boolean | undefined) ??
            registrationSheet?.registeredDay2 ??
            false,
          onboarding: registrationSheet?.onboarding ?? false,
        };
      }),
    },
    ticketTransfer: {
      findFirst: vi.fn(async () => {
        calls.push({ model: "ticketTransfer", op: "findFirst" });
        return existingTransfer;
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

describe("checkinTicket", () => {
  it("checks in a valid ticket for day 1, setting registeredDay1 and leaving registeredDay2 untouched", async () => {
    const deps = createFakeDeps();

    const result = await checkinTicket(validInput, deps);

    expect(result).toEqual({
      ok: true,
      outcome: "checked-in",
      transferred: false,
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: true,
        registeredDay2: false,
        onboarding: false,
      },
    });

    const update = deps.calls.find(
      (c) => c.model === "registrationSheet" && c.op === "update",
    )?.data as Record<string, unknown>;
    expect(update).toEqual({ registeredDay1: true });
  });

  it("checks in a valid ticket for day 2, setting registeredDay2 and leaving registeredDay1 untouched", async () => {
    const deps = createFakeDeps();

    const result = await checkinTicket({ ...validInput, day: 2 }, deps);

    expect(result).toEqual({
      ok: true,
      outcome: "checked-in",
      transferred: false,
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: false,
        registeredDay2: true,
        onboarding: false,
      },
    });

    const update = deps.calls.find(
      (c) => c.model === "registrationSheet" && c.op === "update",
    )?.data as Record<string, unknown>;
    expect(update).toEqual({ registeredDay2: true });
  });

  it("returns already-registered-today without writing when the selected day's flag is already true", async () => {
    const deps = createFakeDeps({
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: true,
        registeredDay2: false,
        onboarding: false,
        ticket: {
          id: "ticket-1",
          user: { id: "user-1", email: "attendee@example.com", fullName: null },
        },
      },
    });

    const result = await checkinTicket(validInput, deps);

    expect(result).toEqual({
      ok: true,
      outcome: "already-registered-today",
      transferred: false,
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: true,
        registeredDay2: false,
        onboarding: false,
      },
    });
    expect(
      deps.calls.some(
        (c) => c.model === "registrationSheet" && c.op === "update",
      ),
    ).toBe(false);
  });

  it("returns ticket-not-found when the registration sheet id doesn't match any sheet, without writing", async () => {
    const deps = createFakeDeps({ registrationSheet: null });

    const result = await checkinTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "ticket-not-found" });
    expect(deps.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("returns user-not-found when the matching ticket has no resolvable user, without writing", async () => {
    const deps = createFakeDeps({
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: false,
        registeredDay2: false,
        onboarding: false,
        ticket: { id: "ticket-1", user: null },
      },
    });

    const result = await checkinTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "user-not-found" });
    expect(deps.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("returns transferred: true on a first-time checked-in result when a TicketTransfer row exists for this ticket", async () => {
    const deps = createFakeDeps({ existingTransfer: { id: "transfer-1" } });

    const result = await checkinTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(result.outcome).toBe("checked-in");
    expect(result.transferred).toBe(true);
  });

  it("returns transferred: true on an already-registered-today result when a TicketTransfer row exists for this ticket", async () => {
    const deps = createFakeDeps({
      registrationSheet: {
        id: "sheet-1",
        registeredDay1: true,
        registeredDay2: false,
        onboarding: false,
        ticket: {
          id: "ticket-1",
          user: { id: "user-1", email: "attendee@example.com", fullName: null },
        },
      },
      existingTransfer: { id: "transfer-1" },
    });

    const result = await checkinTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(result.outcome).toBe("already-registered-today");
    expect(result.transferred).toBe(true);
  });

  it("returns transferred: false when no TicketTransfer row exists for this ticket", async () => {
    const deps = createFakeDeps();

    const result = await checkinTicket(validInput, deps);

    if (!result.ok) throw new Error("expected ok result");
    expect(result.transferred).toBe(false);
  });

  it("returns an invalid-input error when registrationSheetId is missing, without touching the database", async () => {
    const deps = createFakeDeps();

    const result = await checkinTicket(
      { ...validInput, registrationSheetId: "" },
      deps,
    );

    expect(result).toEqual({
      ok: false,
      error: "invalid-input",
      fieldErrors: { registrationSheetId: "Registration sheet id is required" },
    });
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns an invalid-input error when day is not 1 or 2, without touching the database", async () => {
    const deps = createFakeDeps();

    const result = await checkinTicket(
      // biome-ignore lint/suspicious/noExplicitAny: intentionally invalid input for validation test
      { ...validInput, day: 3 as any },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error result");
    expect(result.error).toBe("invalid-input");
    expect(deps.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns an unknown-error result for unexpected database failures", async () => {
    const deps = createFakeDeps();
    deps.prisma.$transaction = vi.fn(async () => {
      throw new Error("connection reset");
    });

    const result = await checkinTicket(validInput, deps);

    expect(result).toEqual({ ok: false, error: "unknown-error" });
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
