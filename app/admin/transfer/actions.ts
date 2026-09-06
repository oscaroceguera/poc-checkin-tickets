"use server";

import { type TransferredTicket, transferTicket } from "@/lib/tickets/transfer";

export type TransferTicketActionState =
  | { status: "idle" }
  | { status: "success"; transfer: TransferredTicket }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function transferTicketAction(
  _prevState: TransferTicketActionState,
  formData: FormData,
): Promise<TransferTicketActionState> {
  const result = await transferTicket({
    originalTicketId: String(formData.get("originalTicketId") ?? ""),
    newUserEmail: String(formData.get("newUserEmail") ?? ""),
    newUserFullName: String(formData.get("newUserFullName") ?? "") || undefined,
  });

  if (result.ok) {
    return { status: "success", transfer: result.transfer };
  }

  if (result.error === "invalid-input") {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: result.fieldErrors,
    };
  }

  if (result.error === "ticket-not-found") {
    return {
      status: "error",
      message: "No ticket was found with that id.",
    };
  }

  if (result.error === "already-transferred") {
    return {
      status: "error",
      message: "This ticket has already been transferred.",
    };
  }

  return {
    status: "error",
    message: "Something went wrong. Please try again.",
  };
}
