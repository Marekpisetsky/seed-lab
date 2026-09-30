"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form";
import {
  EMPTY_HOLDING_FORM,
  validateHoldingForm,
  type HoldingFormErrors,
  type HoldingFormValues,
} from "@/lib/holding-form";
import { problemText } from "@/lib/problems";
import type { HoldingInput } from "@/lib/types";

const COMMON_CURRENCIES = ["EUR", "USD", "GBP", "GBX", "CHF", "PLN", "SEK", "NOK", "DKK", "CAD", "JPY"];

interface HoldingFormProps {
  initialValues?: HoldingFormValues;
  submitLabel: string;
  onSubmit: (holding: HoldingInput) => void;
  onCancel: () => void;
}

export function HoldingForm({ initialValues = EMPTY_HOLDING_FORM, submitLabel, onSubmit, onCancel }: HoldingFormProps) {
  const { m, f } = useI18n();
  const t = m.holdings.form;
  const [values, setValues] = useState(initialValues);
  const [problems, setProblems] = useState<HoldingFormErrors>({});
  const error = (name: keyof HoldingFormValues) => {
    const item = problems[name];
    return item && problemText(item, m.problems);
  };

  const bind = (name: keyof HoldingFormValues) => ({
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: event.target.value }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateHoldingForm(values, f.decimalSeparator === ",");
    if (!result.ok) {
      setProblems(result.errors);
      return;
    }
    onSubmit(result.value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg border border-border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label={t.ticker} error={error("ticker")} hint={t.tickerHint}>
          {(props) => (
            <input {...props} {...bind("ticker")} autoCapitalize="characters" placeholder="VWCE" className={inputClass} />
          )}
        </Field>
        <Field label={t.shares} error={error("quantity")}>
          {(props) => <input {...props} {...bind("quantity")} inputMode="decimal" placeholder="12.5" className={inputClass} />}
        </Field>
        <Field label={t.totalPaid} error={error("costBasis")} hint={t.totalPaidHint}>
          {(props) => <input {...props} {...bind("costBasis")} inputMode="decimal" placeholder="1250.00" className={inputClass} />}
        </Field>
        <Field label={t.currency} error={error("currency")}>
          {(props) => (
            <>
              <input {...props} {...bind("currency")} list="holding-currencies" autoCapitalize="characters" maxLength={3} className={inputClass} />
              <datalist id="holding-currencies">
                {COMMON_CURRENCIES.map((code) => (
                  <option key={code} value={code} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label={t.price} error={error("currentPrice")} hint={t.priceHint}>
          {(props) => <input {...props} {...bind("currentPrice")} inputMode="decimal" placeholder="118.20" className={inputClass} />}
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
