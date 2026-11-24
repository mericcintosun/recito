import Link from "next/link";
import { FLOW_STEPS, type FlowStepSlug } from "@/lib/flow-session";
import { cn } from "@/lib/utils";

/** Persistent, route-based progress for the screening flow. Every step is a link. */
export function FlowProgress({ current }: { current: FlowStepSlug }) {
  const at = FLOW_STEPS.findIndex((s) => s.slug === current);
  return (
    <nav aria-label="Screening progress">
      <ol className="grid grid-cols-3 gap-3">
        {FLOW_STEPS.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/screen/${s.slug}`}
              aria-current={i === at ? "step" : undefined}
              className="block rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={cn("block h-2 rounded-full", i <= at ? "bg-primary" : "bg-line")} />
              <span className={cn("mt-2 block text-sm", i === at ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
