import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const NAV = [
  { href: "/screen/passage", label: "Screen a reader" },
  { href: "/result/maya-r-0909", label: "Sample record" },
  { href: "/about", label: "Method" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <BrandMark size={30} />
          Recito
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
