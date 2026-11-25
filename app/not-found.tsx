import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <div className="space-y-5 rounded-2xl bg-card p-8 text-center shadow-float">
        <p className="font-display text-sm font-semibold text-primary">Recito</p>
        <h1 className="text-2xl font-semibold">We could not find that page</h1>
        <p className="text-muted-foreground">
          The link may be mistyped, or it points to a reading that was never saved here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to the start</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/result/maya-r-0909">Open a sample record</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
