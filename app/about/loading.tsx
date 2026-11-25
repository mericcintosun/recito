export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-12 md:py-16" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the method page.</p>
      <div className="space-y-4">
        <div className="h-12 w-[28rem] max-w-full rounded-2xl bg-surface" />
        <div className="h-6 max-w-[68ch] rounded-2xl bg-surface" />
      </div>
      <div className="h-72 rounded-2xl bg-surface shadow-float" />
      <div className="h-64 rounded-2xl bg-surface shadow-float" />
    </div>
  );
}
