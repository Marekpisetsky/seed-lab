/** Shown for the moment the results code loads after the first questions. */
export function ResultsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your results">
      {[0, 1].map((key) => (
        <div key={key} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}
