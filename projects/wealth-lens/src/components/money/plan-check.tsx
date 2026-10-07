"use client";

import { useI18n } from "@/components/i18n";
import { IntentLink } from "@/components/ui/intent-link";
import { checkWords } from "@/i18n/check-text";
import { localePath } from "@/i18n/locales";
import type { PlanCheck } from "@/lib/plan-check";
import { ResultSection } from "./result-section";

/** Where How it works explains the checks, each with a link to its research sheet. */
export const CHECK_ANCHOR = "check";

/**
 * "Check your plan": none, one, two or three observations (lib/plan-check.ts),
 * each what stands out and the figures behind it, in euros, with a link to
 * how it is worked out. Nothing is shown when nothing stands out. It says
 * what is, never what to do.
 */
export function PlanCheckSection({ checks }: { checks: readonly PlanCheck[] }) {
  const i18n = useI18n();
  const { m, locale } = i18n;
  if (checks.length === 0) return null;
  return (
    <ResultSection title={m.check.title}>
      <p className="text-sm text-muted">{m.check.intro}</p>
      <ul className="space-y-3">
        {checks.map((check) => {
          const { lead, details } = checkWords(check, i18n);
          return (
            <li key={check.id} className="space-y-1 rounded-lg border border-border bg-background p-3">
              <p className="text-base font-medium">{lead.join(" ")}</p>
              <ul className="space-y-0.5 text-sm text-muted">
                {details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <IntentLink href={localePath(`/how-it-works#${CHECK_ANCHOR}`, locale)} className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-2">
                {m.check.how}
              </IntentLink>
            </li>
          );
        })}
      </ul>
    </ResultSection>
  );
}
