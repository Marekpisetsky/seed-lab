/** Shown during the server render, before saved data is read from the browser. */
export function ModuleSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your data">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}
