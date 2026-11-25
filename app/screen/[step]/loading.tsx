export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:py-14" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading this step of the screening.</p>
      <div className="h-12 max-w-xl rounded-2xl bg-surface" />
      <div className="space-y-3">
        <div className="h-10 w-72 max-w-full rounded-2xl bg-surface" />
        <div className="h-6 max-w-[68ch] rounded-2xl bg-surface" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-80 rounded-2xl bg-surface shadow-float" />
        <div className="h-56 rounded-2xl bg-surface shadow-float" />
      </div>
    </div>
  );
}
