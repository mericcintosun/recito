"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/screen/passage", label: "Screen a reader", match: "/screen" },
  { href: "/result/maya-r-0909", label: "Sample record", match: "/result" },
  { href: "/about", label: "Method", match: "/about" },
];

export function NavLinks() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
      {NAV.map((item) => {
        const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-xl px-3 py-2 text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-surface text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
