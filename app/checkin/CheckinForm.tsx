"use client";

import { useActionState, useState } from "react";
import { type CheckinTicketActionState, checkinTicketAction } from "./actions";
import { QrScanner } from "./QrScanner";

const initialState: CheckinTicketActionState = { status: "idle" };

const outcomeCopy = {
  "checked-in": "Checked in",
  "already-registered-today": "Already registered today",
} as const;

function IconWrapper({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CheckCircleIcon({ className }: { className: string }) {
  return (
    <IconWrapper className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </IconWrapper>
  );
}

function ClockIcon({ className }: { className: string }) {
  return (
    <IconWrapper className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </IconWrapper>
  );
}

function ArrowExchangeIcon({ className }: { className: string }) {
  return (
    <IconWrapper className={className}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </IconWrapper>
  );
}

function XCircleIcon({ className }: { className: string }) {
  return (
    <IconWrapper className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </IconWrapper>
  );
}

function AlertTriangleIcon({ className }: { className: string }) {
  return (
    <IconWrapper className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconWrapper>
  );
}

export function CheckinForm() {
  const [state, formAction, pending] = useActionState(
    checkinTicketAction,
    initialState,
  );
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [registrationSheetId, setRegistrationSheetId] = useState("");

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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="registrationSheetId"
              className="text-sm font-medium"
            >
              Ticket QR / registration sheet id
              <span aria-hidden="true"> *</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setMode((current) =>
                  current === "camera" ? "manual" : "camera",
                )
              }
              className="text-sm font-medium underline"
            >
              {mode === "camera"
                ? "Switch to manual entry"
                : "Switch to camera"}
            </button>
          </div>

          {mode === "camera" && (
            <QrScanner
              active={mode === "camera"}
              onScan={setRegistrationSheetId}
            />
          )}

          <input
            id="registrationSheetId"
            name="registrationSheetId"
            type="text"
            required
            value={registrationSheetId}
            onChange={(event) => setRegistrationSheetId(event.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          {state.status === "error" &&
            state.fieldErrors?.registrationSheetId && (
              <p
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {state.fieldErrors.registrationSheetId}
              </p>
            )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto dark:bg-white dark:text-black"
        >
          {pending ? "Checking in…" : "Check in"}
        </button>
      </form>

      {state.status === "error" &&
        (state.code === "generic" ? (
          <p
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : (
          <div
            className="flex w-full items-start gap-3 rounded border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30"
            role="alert"
            aria-live="polite"
          >
            {state.code === "ticket-not-found" ? (
              <XCircleIcon className="text-red-700 dark:text-red-400" />
            ) : (
              <AlertTriangleIcon className="text-red-700 dark:text-red-400" />
            )}
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {state.message}
            </p>
          </div>
        ))}

      {state.status === "success" && (
        <div className="flex w-full flex-col items-start gap-3">
          <div
            className={
              state.outcome === "checked-in"
                ? "flex w-full items-start gap-3 rounded border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30"
                : "flex w-full items-start gap-3 rounded border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
            }
          >
            {state.outcome === "checked-in" ? (
              <CheckCircleIcon className="text-green-700 dark:text-green-400" />
            ) : (
              <ClockIcon className="text-amber-700 dark:text-amber-400" />
            )}
            <output
              className={
                state.outcome === "checked-in"
                  ? "text-sm font-medium text-green-700 dark:text-green-400"
                  : "text-sm font-medium text-amber-700 dark:text-amber-400"
              }
              aria-live="polite"
            >
              {outcomeCopy[state.outcome]}
            </output>
          </div>
          {state.transferred && (
            <div
              className="flex w-full items-start gap-3 rounded border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
              role="alert"
            >
              <ArrowExchangeIcon className="text-amber-700 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                This ticket was transferred to another user.
              </p>
            </div>
          )}
          <p className="break-words text-sm text-gray-700 dark:text-gray-400">
            Registration sheet id: {state.registrationSheet.id}
          </p>
        </div>
      )}
    </div>
  );
}
