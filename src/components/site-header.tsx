"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/register", label: "Register" },
  { href: "/create", label: "Create" },
  { href: "/check", label: "Check" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl tracking-tight">
          ModelLedger
        </Link>
        <nav className="flex gap-6 text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "text-seal" : "text-muted"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
