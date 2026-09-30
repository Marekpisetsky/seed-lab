/**
 * A dictionary sentence with its key figure marked "**like this**": the
 * marked part is bold, so each language places it where its words need it.
 */
export function Marked({ text, strongClassName = "font-medium text-foreground tabular-nums" }: { text: string; strongClassName?: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/).map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className={strongClassName}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
