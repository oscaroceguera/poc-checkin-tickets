import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(
      async (text: string) => `data:image/png;base64,fake(${text})`,
    ),
  },
}));

import QRCode from "qrcode";
import { type ListTicketsDeps, listTickets } from "./list";

interface FakeTicket {
  id: string;
  ticketType: string;
  user: { email: string; fullName: string | null };
  registration: { id: string } | null;
}

interface FakeTransfer {
  originalTicketId: string;
  transferredTicketId: string;
}

function createFakeDeps(
  tickets: FakeTicket[],
  transfers: FakeTransfer[] = [],
): ListTicketsDeps {
  return {
    prisma: {
      ticket: {
        findMany: vi.fn(async () => tickets),
      },
      ticketTransfer: {
        findMany: vi.fn(async () => transfers),
      },
    },
  };
}

beforeEach(() => {
  vi.mocked(QRCode.toDataURL).mockClear();
});

describe("listTickets", () => {
  it("returns all tickets with correct shape when no transfers exist", async () => {
    const deps = createFakeDeps([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registration: { id: "sheet-1" },
      },
    ]);

    const result = await listTickets(deps);

    expect(result).toEqual([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registrationSheetId: "sheet-1",
        qrDataUrl: "data:image/png;base64,fake(sheet-1)",
        isTransferred: false,
      },
    ]);
  });

  it("marks a ticket isTransferred true with originalTicketId/transferredTicketId when a matching TicketTransfer row exists", async () => {
    const deps = createFakeDeps(
      [
        {
          id: "ticket-1",
          ticketType: "EARLY-BIRD",
          user: { email: "ada@example.com", fullName: "Ada Lovelace" },
          registration: { id: "sheet-1" },
        },
      ],
      [{ originalTicketId: "ticket-1", transferredTicketId: "ticket-2" }],
    );

    const result = await listTickets(deps);

    expect(result).toEqual([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registrationSheetId: "sheet-1",
        qrDataUrl: "data:image/png;base64,fake(sheet-1)",
        isTransferred: true,
        originalTicketId: "ticket-1",
        transferredTicketId: "ticket-2",
      },
    ]);
  });

  it("does not mark an untransferred ticket with originalTicketId/transferredTicketId fields", async () => {
    const deps = createFakeDeps([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registration: { id: "sheet-1" },
      },
    ]);

    const [ticket] = await listTickets(deps);

    expect(ticket.isTransferred).toBe(false);
    expect(ticket).not.toHaveProperty("originalTicketId");
    expect(ticket).not.toHaveProperty("transferredTicketId");
  });

  it("returns an empty array when there are no tickets", async () => {
    const deps = createFakeDeps([]);

    const result = await listTickets(deps);

    expect(result).toEqual([]);
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it("generates qrDataUrl per ticket from its registration sheet id", async () => {
    const deps = createFakeDeps([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registration: { id: "sheet-1" },
      },
      {
        id: "ticket-2",
        ticketType: "NORMAL",
        user: { email: "grace@example.com", fullName: "Grace Hopper" },
        registration: { id: "sheet-2" },
      },
    ]);

    const result = await listTickets(deps);

    expect(QRCode.toDataURL).toHaveBeenCalledWith("sheet-1");
    expect(QRCode.toDataURL).toHaveBeenCalledWith("sheet-2");
    expect(result[0].qrDataUrl).toBe("data:image/png;base64,fake(sheet-1)");
    expect(result[1].qrDataUrl).toBe("data:image/png;base64,fake(sheet-2)");
  });

  it("skips a ticket with no registration sheet, guarding defensively", async () => {
    const deps = createFakeDeps([
      {
        id: "ticket-1",
        ticketType: "EARLY-BIRD",
        user: { email: "ada@example.com", fullName: "Ada Lovelace" },
        registration: null,
      },
    ]);

    const result = await listTickets(deps);

    expect(result).toEqual([]);
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it("uses the injected deps.prisma, never the real shared client", async () => {
    const deps = createFakeDeps([]);

    await listTickets(deps);

    expect(deps.prisma.ticket.findMany).toHaveBeenCalledWith({
      include: { user: true, registration: true },
    });
    expect(deps.prisma.ticketTransfer.findMany).toHaveBeenCalled();
  });
});
