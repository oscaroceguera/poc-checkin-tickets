import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export interface ListedTicket {
  id: string;
  ticketType: string;
  user: { email: string; fullName: string | null };
  registrationSheetId: string;
  qrDataUrl: string;
  isTransferred: boolean;
  originalTicketId?: string;
  transferredTicketId?: string;
}

interface TicketWithRelations {
  id: string;
  ticketType: string;
  user: { email: string; fullName: string | null };
  registration: { id: string } | null;
}

interface TicketTransferRow {
  originalTicketId: string;
  transferredTicketId: string;
}

interface ListTicketsPrismaClient {
  ticket: {
    findMany(args: {
      include: { user: true; registration: true };
    }): Promise<TicketWithRelations[]>;
  };
  ticketTransfer: {
    findMany(): Promise<TicketTransferRow[]>;
  };
}

export interface ListTicketsDeps {
  prisma: ListTicketsPrismaClient;
}

export async function listTickets(
  deps: ListTicketsDeps = { prisma },
): Promise<ListedTicket[]> {
  const [tickets, transfers] = await Promise.all([
    deps.prisma.ticket.findMany({
      include: { user: true, registration: true },
    }),
    deps.prisma.ticketTransfer.findMany(),
  ]);

  const transferByOriginalTicketId = new Map(
    transfers.map((transfer) => [transfer.originalTicketId, transfer]),
  );

  const listedTickets: ListedTicket[] = [];

  for (const ticket of tickets) {
    const registration = ticket.registration;
    if (!registration) continue;

    const qrDataUrl = await QRCode.toDataURL(registration.id);
    const transfer = transferByOriginalTicketId.get(ticket.id);

    listedTickets.push({
      id: ticket.id,
      ticketType: ticket.ticketType,
      user: { email: ticket.user.email, fullName: ticket.user.fullName },
      registrationSheetId: registration.id,
      qrDataUrl,
      isTransferred: transfer !== undefined,
      ...(transfer
        ? {
            originalTicketId: transfer.originalTicketId,
            transferredTicketId: transfer.transferredTicketId,
          }
        : {}),
    });
  }

  return listedTickets;
}
