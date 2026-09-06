"use server";

import {
  type CheckedInRegistrationSheet,
  checkinTicket,
} from "@/lib/tickets/checkin";

export type CheckinTicketActionState =
  | { status: "idle" }
  | {
      status: "success";
      outcome: "checked-in" | "already-registered-today";
      transferred: boolean;
      registrationSheet: CheckedInRegistrationSheet;
    }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function checkinTicketAction(
  _prevState: CheckinTicketActionState,
  formData: FormData,
): Promise<CheckinTicketActionState> {
  const rawDay = formData.get("day");

  const result = await checkinTicket({
    registrationSheetId: String(formData.get("registrationSheetId") ?? ""),
    day: (rawDay === null ? Number.NaN : Number(rawDay)) as 1 | 2,
  });

  if (result.ok) {
    return {
      status: "success",
      outcome: result.outcome,
      transferred: result.transferred,
      registrationSheet: result.registrationSheet,
    };
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
      message: "This ticket was not recognized.",
    };
  }

  if (result.error === "user-not-found") {
    return {
      status: "error",
      message: "No user could be found for this ticket.",
    };
  }

  return {
    status: "error",
    message: "Something went wrong. Please try again.",
  };
}
