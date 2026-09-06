"use client";

import { useActionState } from "react";
import {
  type GenerateTicketActionState,
  generateTicketAction,
} from "./actions";

const initialState: GenerateTicketActionState = { status: "idle" };

const fields = [
  { name: "email", label: "Email", type: "email", required: true },
  { name: "fullName", label: "Full name", type: "text", required: false },
  { name: "buyer", label: "Buyer", type: "text", required: false },
  { name: "event", label: "Event id", type: "number", required: true },
] as const;

export function GenerateTicketForm() {
  const [state, formAction, pending] = useActionState(
    generateTicketAction,
    initialState,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        {fields.map((field) => {
          const fieldError =
            state.status === "error"
              ? state.fieldErrors?.[field.name]
              : undefined;
          return (
            <div key={field.name} className="flex flex-col gap-1">
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
                {field.required && <span aria-hidden="true"> *</span>}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {fieldError && (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto dark:bg-white dark:text-black"
        >
          {pending ? "Generating…" : "Generate ticket"}
        </button>
      </form>

      {state.status === "error" && (
        <p
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <div className="flex w-full flex-col items-start gap-3 rounded border border-gray-300 p-4 dark:border-gray-700">
          <p className="text-sm font-medium">Ticket generated</p>
          <dl className="break-words text-sm text-gray-700 dark:text-gray-400">
            <div>
              <dt className="inline font-medium">Registration sheet id: </dt>
              <dd className="inline">{state.ticket.registrationSheet.id}</dd>
            </div>
          </dl>
          <img
            src={state.ticket.qrDataUrl}
            alt={`QR ticket for registration sheet ${state.ticket.registrationSheet.id}`}
            width={200}
            height={200}
            className="h-auto w-40 max-w-full sm:w-52"
          />
        </div>
      )}
    </div>
  );
}
