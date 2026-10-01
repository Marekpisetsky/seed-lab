interface PageHeaderProps {
  title: string;
  /** The question this module answers, in the user's words. */
  question: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, question, children }: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-1">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <p className="text-muted">{question}</p>
      {children}
    </header>
  );
}
