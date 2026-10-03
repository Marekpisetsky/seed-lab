interface PageHeaderProps {
  title: string;
  /** The question this module answers, in the user's words. */
  question: string;
  /** A headline that is a whole sentence: a little smaller from 1024 px, so it stays on one line there. */
  sentence?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ title, question, sentence = false, children }: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-1">
      <h1 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${sentence ? "lg:text-[2rem]" : ""}`}>{title}</h1>
      <p className="text-muted">{question}</p>
      {children}
    </header>
  );
}
