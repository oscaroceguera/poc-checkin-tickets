# Requirements

Generate tickets for an event, the event's days are two 2026 october 29th and 2026 octuber 30th.
The Ticket generated will be scan each day, thear some validations like the ticket only allow register the user once per day if the ticket was scanned this day show alert of this ticket was scaned yet, verify if the ticket is a ticket transfer if this is true show alert to the ticket was transfer to other user, the basic alert user not found, ticket don reconized, etc.

Generate a ticket system for a event:

- Create Order
- Create ticket
- Save User info
- Save in RegistrationSheet
- Generate a Ticket with QR (this is the id of RegistrationSheet)

Ticket transfer:

- Create section for ticketTransfer

Checkin of a ticket (the Qr will be scan)

- Scan Ticket's QR by day
- update the RegistrationSheet for the registeredDay1 or registeredDay2

## Stack

- NextJS
- React
- Typescript
- Prisma
- Tailwindcss
- vitest

## Data base:

**RegistrationSheet:**

```
model RegistrationSheet {
  id             String   @id @default(uuid())
  registeredDay1 Boolean  @default(false)
  registeredDay2 Boolean  @default(false)
  ticket         Ticket   @relation(fields: [ticketId], references: [id])
  ticketId       String   @unique
  event          Int
  onboarding     Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Ticket:**

```
model Ticket {
  id           String             @id @default(uuid())
  ticketType   String // TicketType
  user         User               @relation(fields: [userId], references: [id])
  userId       String             @unique
  paymenIntent String
  paymentId    String
  order        Order?             @relation(fields: [orderId], references: [id])
  orderId      String?
  registration RegistrationSheet?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}
```

**Tickettransfer:**

```
model TicketTransfer {
  id                  String   @id @default(uuid())
  originalTicketId    String
  transferredTicketId String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

**Order:**

```
model Order {
  id                String         @id @default(uuid())
  users             User[]
  checkoutSessionId String         @unique
  ticketTypeSale    String // TicketTypeSale
  buyer             String?
  tickets           Ticket[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}
```

**User:**

```
model User {
  id              String                 @id @default(uuid())
  email           String
  fullName        String?
  ticket          Ticket?
  order           Order?                 @relation(fields: [orderId], references: [id])
  orderId         String?
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt
}
```
