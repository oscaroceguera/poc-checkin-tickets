"use server";

import { type GeneratedTicket, generateTicket } from "@/lib/tickets/generate";

export type GenerateTicketActionState =
  | { status: "idle" }
  | { status: "success"; ticket: GeneratedTicket }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function generateTicketAction(
  _prevState: GenerateTicketActionState,
  formData: FormData,
): Promise<GenerateTicketActionState> {
  const result = await generateTicket({
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? "") || undefined,
    buyer: String(formData.get("buyer") ?? "") || undefined,
    event: Number(formData.get("event")),
  });

  if (result.ok) {
    return { status: "success", ticket: result.ticket };
  }

  if (result.error === "invalid-input") {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: result.fieldErrors,
    };
  }

  if (result.error === "duplicate-order") {
    return {
      status: "error",
      message: "An order with this checkout session id already exists.",
    };
  }

  return {
    status: "error",
    message: "Something went wrong. Please try again.",
  };
}
