/**
 * A thing of the list in words, in the page's language: its name, its
 * price ("≈ €2,330" for a rough one) and where that price comes from, for
 * the country whose prices it uses. The figures are in lib/calculator.ts.
 */

import type { I18n } from ".";
import { countryInSentence } from "./countries";
import type { PricedItem } from "@/lib/calculator";

/** "A used car"; an item no longer on the list keeps its id. */
export function itemName(id: string, { m }: I18n): string {
  return m.things.items[id]?.name ?? id;
}

/** "€17,758", or "≈ €640" for a rough estimate. */
export function itemPrice(item: PricedItem, { f }: I18n): string {
  return `${item.estimate ? "≈ " : ""}${f.eur(item.amount)}`;
}

/**
 * Where the price comes from: the source of a figure that is the same
 * everywhere, or what a country's figure is, who published it and when
 * ("Average price of a used car in Spain (asking prices): coches.net,
 * 2025.").
 */
export function itemSource(item: PricedItem, i18n: I18n): string {
  const { m, f } = i18n;
  const words = m.things.items[item.id];
  if (!words) return "";
  if (!words.about) return words.source;
  const country = countryInSentence(item.country ?? "NL", i18n);
  const figure = item.figure;
  if (item.monthsHome !== null) {
    const living = m.things.livingSource(words.about(country, ""), item.referenceDate);
    return figure ? `${living} ${m.things.feesSource(f.eur(figure.amount), figure.source, figure.referenceDate)}` : living;
  }
  if (!figure) return "";
  const { calc } = figure;
  // A home deposit names the price of the whole home it is part of.
  const home = typeof calc?.squareMetres === "number" && typeof calc.eurPerSquareMetre === "number" ? f.eur(calc.squareMetres * calc.eurPerSquareMetre) : "";
  return m.things.figureSource(words.about(country, home), m.things.basis[figure.basis], figure.source, figure.referenceDate);
}
