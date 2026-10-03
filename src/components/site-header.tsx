"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";

const links = [
  { href: "/register", label: "Register" },
  { href: "/create", label: "Create" },
  { href: "/check", label: "Check" },
];

export function SiteHeader({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl tracking-tight">
          <span className="grid size-8 place-items-center rounded-xl bg-seal text-sm text-paper">M</span>
          ModelLedger
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <nav className="flex gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 transition ${
                    active ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <span className="mx-2 h-5 w-px bg-line" />
          {email ? (
            <form action={signOut} className="flex items-center gap-3">
              <span className="hidden max-w-40 truncate text-muted sm:inline">{email}</span>
              <button type="submit" className="rounded-lg px-3 py-2 text-seal transition hover:bg-seal-soft">
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/sign-in"
              className={`rounded-lg px-3 py-2 transition ${
                pathname === "/sign-in" ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
