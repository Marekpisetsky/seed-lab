"use client";

import { updatePlan } from "@/lib/app-store";
import { costOfLiving, countryInSentence } from "@/lib/cost-of-living";
import type { Plan } from "@/lib/types";

const COUNTRIES = [...costOfLiving.countries].sort((a, b) => a.name.localeCompare(b.name));

/** Where the user lives and whether they rent: it prices stopping work, rent and a year off. */
export function PlaceSettings({ plan }: { plan: Pick<Plan, "homeCountry" | "housing"> }) {
  const selectClass = "rounded-md border border-border bg-background px-2 py-1 text-xs";
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
      Prices for one person in
      <select
        aria-label="Your country"
        value={plan.homeCountry}
        onChange={(event) => updatePlan({ homeCountry: event.target.value })}
        className={selectClass}
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {countryInSentence(country.name)}
          </option>
        ))}
      </select>
      <select
        aria-label="Housing"
        value={plan.housing}
        onChange={(event) => updatePlan({ housing: event.target.value === "own" ? "own" : "rent" })}
        className={selectClass}
      >
        <option value="rent">renting</option>
        <option value="own">owning a home</option>
      </select>
    </p>
  );
}
