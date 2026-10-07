import { Marked } from "@/components/ui/marked";
import type { ProseSection } from "@/i18n/page-types";

/** Sections of a long page: a heading and short paragraphs each. */
export function Prose({ sections }: { sections: readonly ProseSection[] }) {
  return (
    <div className="max-w-2xl space-y-8">
      {sections.map((section) => (
        <section key={section.heading} id={section.id} className="scroll-mt-24 space-y-2">
          <h2 className="text-lg font-bold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              <Marked text={paragraph} strongClassName="font-semibold" />
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
