"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form";
import { formatMoney } from "@/lib/format";
import { validatePlanAnswers, type PlanAnswers, type PlanErrors } from "@/lib/plan";
import { BASE_CURRENCY } from "@/lib/types";

interface PlanFormProps {
  initial: PlanAnswers;
  submitLabel: string;
  /** When set, the invested amount comes from holdings and is not asked. */
  holdingsValue: number | null;
  onSubmit: (answers: { invested: number; monthly: number; goal: number }) => void;
  onCancel?: () => void;
}

/** The three numbers the whole app runs on. Used for first use and "Edit plan". */
export function PlanForm({ initial, submitLabel, holdingsValue, onSubmit, onCancel }: PlanFormProps) {
  const [answers, setAnswers] = useState(initial);
  const [errors, setErrors] = useState<PlanErrors>({});

  const bind = (name: keyof PlanAnswers) => ({
    value: answers[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setAnswers({ ...answers, [name]: event.target.value }),
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = validatePlanAnswers(holdingsValue === null ? answers : { ...answers, invested: "0" });
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        onSubmit(result);
      }}
    >
      {holdingsValue === null ? (
        <Field label="How much do you have invested?" error={errors.invested}>
          {(props) => <input {...props} {...bind("invested")} inputMode="decimal" placeholder="€ 20,000" className={inputClass} />}
        </Field>
      ) : (
        <p className="text-sm text-muted">
          Invested: {formatMoney(holdingsValue, BASE_CURRENCY, { decimals: 0 })} (from your holdings)
        </p>
      )}
      <Field label="How much do you add each month?" error={errors.monthly}>
        {(props) => <input {...props} {...bind("monthly")} inputMode="decimal" placeholder="€ 500" className={inputClass} />}
      </Field>
      <Field label="What's your goal?" error={errors.goal}>
        {(props) => <input {...props} {...bind("goal")} inputMode="decimal" placeholder="€ 250,000" className={inputClass} />}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
