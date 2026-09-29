/**
 * Starts loading the results screens while the user is still answering the
 * first questions, so they appear at once on submit without weighing on the
 * first screen's load.
 */
let started = false;

export function prefetchResults(): void {
  if (started) return;
  started = true;
  void import("@/components/portfolio/portfolio-content");
  void import("@/components/fire/fire-content");
  void import("@/components/charts/charts-content");
}
