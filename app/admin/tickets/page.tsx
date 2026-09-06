import { listTickets } from "@/lib/tickets/list";

// This page reads live ticket/transfer state directly from Prisma on every
// request (not via `fetch`), so it must be excluded from Next's static
// optimization — otherwise it would be prerendered once at build time and
// never reflect tickets generated or transferred afterward.
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const tickets = await listTickets();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:p-8">
      <h1 className="text-lg font-semibold sm:text-xl">Tickets</h1>

      {tickets.length === 0 ? (
        <p className="text-sm text-gray-700 dark:text-gray-400">
          No tickets have been generated yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex w-full flex-col items-start gap-3 rounded border border-gray-300 p-4 dark:border-gray-700"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <p className="text-sm font-medium">{ticket.ticketType}</p>
                {ticket.isTransferred && (
                  <span className="rounded bg-black px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-black">
                    Transferred
                  </span>
                )}
              </div>
              <dl className="break-words text-sm text-gray-700 dark:text-gray-400">
                <div>
                  <dt className="inline font-medium">
                    {ticket.user.fullName ?? "Name not provided"}
                  </dt>
                </div>
                <div>
                  <dd className="inline">{ticket.user.email}</dd>
                </div>
              </dl>
              <img
                src={ticket.qrDataUrl}
                alt={`QR ticket for registration sheet ${ticket.registrationSheetId}`}
                width={200}
                height={200}
                className="h-auto w-40 max-w-full sm:w-52"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
