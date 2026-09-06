"use client";

import { useActionState } from "react";
import {
  type TransferTicketActionState,
  transferTicketAction,
} from "./actions";

const initialState: TransferTicketActionState = { status: "idle" };

const fields = [
  {
    name: "originalTicketId",
    label: "Original ticket id",
    type: "text",
    required: true,
  },
  {
    name: "newUserEmail",
    label: "New attendee email",
    type: "email",
    required: true,
  },
  {
    name: "newUserFullName",
    label: "New attendee full name",
    type: "text",
    required: false,
  },
] as const;

export function TransferTicketForm() {
  const [state, formAction, pending] = useActionState(
    transferTicketAction,
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
          {pending ? "Transferring…" : "Transfer ticket"}
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
          <p className="text-sm font-medium">Ticket transferred</p>
          <dl className="break-words text-sm text-gray-700 dark:text-gray-400">
            <div>
              <dt className="inline font-medium">
                New registration sheet id:{" "}
              </dt>
              <dd className="inline">{state.transfer.registrationSheet.id}</dd>
            </div>
            <div>
              <dt className="inline font-medium">New attendee: </dt>
              <dd className="inline">{state.transfer.user.email}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
