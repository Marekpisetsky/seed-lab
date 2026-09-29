"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NumberInput, PercentInput } from "@/components/ui/form";
import { formatMoney } from "@/lib/format";
import { BASE_CURRENCY, type FireSettings } from "@/lib/types";

interface FireInputsProps {
  capital: number;
  portfolioCapital: number;
  settings: FireSettings;
  withdrawalRate: number;
  onSettingsChange: (patch: Partial<FireSettings>) => void;
  onWithdrawalRateChange: (rate: number) => void;
}

const HOUSING_OPTIONS = [
  { value: "rent", label: "Renting", hint: "1-bedroom outside the centre" },
  { value: "own", label: "Own home", hint: "No rent to pay" },
] as const;

export function FireInputs({
  capital,
  portfolioCapital,
  settings,
  withdrawalRate,
  onSettingsChange,
  onWithdrawalRateChange,
}: FireInputsProps) {
  const usingPortfolio = settings.capitalOverride === null;
  return (
    <Card title="Your numbers">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label={`Invested capital (${BASE_CURRENCY})`}
          hint={
            usingPortfolio ? (
              "Your EUR holdings at current prices."
            ) : (
              <Button size="sm" variant="ghost" className="-ml-2" onClick={() => onSettingsChange({ capitalOverride: null })}>
                Use portfolio value ({formatMoney(portfolioCapital, BASE_CURRENCY, { decimals: 0 })})
              </Button>
            )
          }
        >
          {(props) => (
            <NumberInput
              {...props}
              key={capital}
              value={Math.round(capital)}
              min={0}
              onCommit={(value) => value !== null && onSettingsChange({ capitalOverride: value })}
            />
          )}
        </Field>
        <Field label="Withdrawal rate (% per year)" hint="4% is the classic rule of thumb.">
          {(props) => (
            <PercentInput
              {...props}
              key={withdrawalRate}
              value={withdrawalRate}
              min={0.5}
              max={10}
              onCommit={(value) => value !== null && onWithdrawalRateChange(value)}
            />
          )}
        </Field>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Housing</legend>
          <div className="grid grid-cols-2 gap-2">
            {HOUSING_OPTIONS.map((option) => {
              const checked = settings.housing === option.value;
              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 ${
                    checked ? "border-accent bg-accent/10" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="housing"
                    value={option.value}
                    checked={checked}
                    onChange={() => onSettingsChange({ housing: option.value })}
                    className="sr-only"
                  />
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </Card>
  );
}
