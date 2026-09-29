"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form";
import {
  EMPTY_HOLDING_FORM,
  validateHoldingForm,
  type HoldingFormErrors,
  type HoldingFormValues,
} from "@/lib/holding-form";
import type { HoldingInput } from "@/lib/types";

const COMMON_CURRENCIES = ["EUR", "USD", "GBP", "GBX", "CHF", "PLN", "SEK", "NOK", "DKK", "CAD", "JPY"];

interface HoldingFormProps {
  initialValues?: HoldingFormValues;
  submitLabel: string;
  onSubmit: (holding: HoldingInput) => void;
  onCancel: () => void;
}

export function HoldingForm({ initialValues = EMPTY_HOLDING_FORM, submitLabel, onSubmit, onCancel }: HoldingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<HoldingFormErrors>({});

  const bind = (name: keyof HoldingFormValues) => ({
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: event.target.value }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateHoldingForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg border border-border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Ticker" error={errors.ticker}>
          {(props) => (
            <input {...props} {...bind("ticker")} autoCapitalize="characters" placeholder="VWCE" className={inputClass} />
          )}
        </Field>
        <Field label="Shares" error={errors.quantity}>
          {(props) => <input {...props} {...bind("quantity")} inputMode="decimal" placeholder="12.5" className={inputClass} />}
        </Field>
        <Field label="Total paid" error={errors.costBasis} hint="For all shares">
          {(props) => <input {...props} {...bind("costBasis")} inputMode="decimal" placeholder="1250.00" className={inputClass} />}
        </Field>
        <Field label="Currency" error={errors.currency}>
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
        <Field label="Price per share" error={errors.currentPrice} hint="Optional for big ETFs and stocks">
          {(props) => <input {...props} {...bind("currentPrice")} inputMode="decimal" placeholder="118.20" className={inputClass} />}
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
