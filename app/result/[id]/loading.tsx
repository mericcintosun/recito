export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:py-14" aria-busy="true" aria-live="polite">
      <p className="sr-only">Opening the running record.</p>
      <div className="space-y-3">
        <div className="h-10 w-96 max-w-full rounded-2xl bg-surface" />
        <div className="h-6 max-w-[70ch] rounded-2xl bg-surface" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-96 rounded-2xl bg-surface shadow-float" />
        <div className="space-y-6">
          <div className="h-56 rounded-2xl bg-surface shadow-float" />
          <div className="h-40 rounded-2xl bg-surface shadow-float" />
        </div>
      </div>
    </div>
  );
}
