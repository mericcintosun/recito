"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Prints nothing from the error itself: details can carry a transcript, and a teacher
// cannot act on a stack trace anyway.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <div className="space-y-5 rounded-2xl bg-card p-8 text-center shadow-float">
        <p className="font-display text-sm font-semibold text-primary">Recito</p>
        <h1 className="text-2xl font-semibold">Something went wrong on this page</h1>
        <p className="text-muted-foreground">
          No audio left your browser. Try the page again, or go back to the start and pick up from there.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to the start</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
