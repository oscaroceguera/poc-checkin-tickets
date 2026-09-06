import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/admin/generate", label: "Generate" },
  { href: "/admin/transfer", label: "Transfer" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/checkin", label: "Check-in" },
] as const;

export function NavBar() {
  return (
    <nav className="w-full border-b border-gray-300 dark:border-gray-700">
      <ul className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm sm:px-8">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded px-2 py-1 font-medium text-black hover:bg-black/[.06] dark:text-gray-100 dark:hover:bg-white/[.08]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
