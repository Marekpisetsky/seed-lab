interface NoticeProps {
  tone?: "warning" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/** A callout placed next to the result it qualifies, not in a footer. */
export function Notice({ tone = "info", title, children, className = "" }: NoticeProps) {
  const styles =
    tone === "warning"
      ? "border-warning-border bg-warning-bg text-warning-foreground"
      : "border-border bg-background text-foreground";
  return (
    <div role="note" className={`rounded-lg border px-3 py-2 text-sm ${styles} ${className}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
