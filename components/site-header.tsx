import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl font-display text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark size={30} />
          Recito
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
