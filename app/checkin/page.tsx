import { CheckinForm } from "./CheckinForm";

export default function CheckinPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 sm:p-8">
      <h1 className="text-lg font-semibold sm:text-xl">Check in ticket</h1>
      <CheckinForm />
    </main>
  );
}
