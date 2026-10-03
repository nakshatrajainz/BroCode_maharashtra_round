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
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          ModelLedger
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <nav className="flex gap-6">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={active ? "text-seal" : "text-muted"}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {email ? (
            <form action={signOut} className="flex items-center gap-3">
              <span className="hidden max-w-40 truncate text-muted sm:inline">{email}</span>
              <button type="submit" className="text-seal">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/sign-in" className={pathname === "/sign-in" ? "text-seal" : "text-muted"}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
