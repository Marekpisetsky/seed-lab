interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Folded by default: the place for everything that is not needed on a
 * first read ("Advanced", "Why…?", "Show all…"). Native <details>, so it
 * works without JavaScript and with the keyboard.
 */
export function Disclosure({ summary, children, className = "" }: DisclosureProps) {
  return (
    <details className={`group rounded-lg border border-border ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {summary}
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
