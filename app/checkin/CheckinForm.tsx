"use client";

import { useActionState } from "react";
import { type CheckinTicketActionState, checkinTicketAction } from "./actions";

const initialState: CheckinTicketActionState = { status: "idle" };

const outcomeCopy = {
  "checked-in": "Checked in",
  "already-registered-today": "Already registered today",
} as const;

export function CheckinForm() {
  const [state, formAction, pending] = useActionState(
    checkinTicketAction,
    initialState,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Event day *</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="day"
                value="1"
                defaultChecked
                required
              />
              Day 1 (Oct 29)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="day" value="2" required />
              Day 2 (Oct 30)
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="registrationSheetId" className="text-sm font-medium">
            Ticket QR / registration sheet id
            <span aria-hidden="true"> *</span>
          </label>
          <input
            id="registrationSheetId"
            name="registrationSheetId"
            type="text"
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {state.status === "error" &&
            state.fieldErrors?.registrationSheetId && (
              <p className="text-sm text-red-600" role="alert">
                {state.fieldErrors.registrationSheetId}
              </p>
            )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Checking in…" : "Check in"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <div className="flex w-full flex-col items-start gap-3 rounded border border-gray-300 p-4">
          <output
            className={
              state.outcome === "checked-in"
                ? "text-sm font-medium text-green-700"
                : "text-sm font-medium text-amber-700"
            }
            aria-live="polite"
          >
            {outcomeCopy[state.outcome]}
          </output>
          {state.transferred && (
            <p className="text-sm font-medium text-amber-700" role="alert">
              This ticket was transferred to another user.
            </p>
          )}
          <p className="break-words text-sm text-gray-700">
            Registration sheet id: {state.registrationSheet.id}
          </p>
        </div>
      )}
    </div>
  );
}
