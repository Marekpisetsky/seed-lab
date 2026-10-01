import { SiteShell } from "./site-shell";

/**
 * A page of the site: the header and footer around it. Its words come from
 * the layout above it ((en)/layout.tsx, [lang]/layout.tsx).
 */
export function Site({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
