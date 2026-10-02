/**
 * The plain-language check every seed-lab tool runs on its words (principle
 * 5, "clear enough for a child and their grandparent"): short sentences,
 * and no jargon outside the places that explain it. Pure functions, so any
 * test runner can use them; an app's test passes its own texts and limits.
 */

import type { Locale } from "./locales.ts";

/** A text with where it comes from: "findings.lever.goalMonthly". */
export interface TextEntry {
  path: string;
  text: string;
}

/** Words a normal person should never have to read, per language. */
export const JARGON: Readonly<Record<Locale, RegExp>> = {
  en: /\b(real|nominal|volatility|volatile|swings?|swung|percentiles?|CPI|HICP|deflator|PPP)\b/i,
  es: /\b(real(es)?|nominal(es)?|volatilidad|vol[aá]til(es)?|percentil(es)?|oscilaci[oó]n(es)?|IPC|IPCA|deflactor|PPA)\b/i,
};

/** Plain phrases that happen to use one of those words. */
export const ALLOWED = [/\breal history\b/i, /\bhistoria real\b/i, /\breal people\b/i, /\bpersonas reales\b/i];

/**
 * How many words a reader meets: "**" marks and a number joined to its
 * "%" or "€" count once ("1 %", "9700 €"), and so does a filled-in value
 * (written "X").
 */
export function words(sentence: string): number {
  return sentence
    .replace(/\*\*/g, "")
    .replace(/(\d)[\s\u00a0]+(?=[%€])/g, "$1")
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}X]/u.test(word)).length;
}

/** The sentences of a text; "·" separates short pieces, each read on its own. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?:])\s+|\s+·\s+/).filter((sentence) => sentence.trim() !== "");
}

/** Whether a text uses jargon, once the allowed phrases and any web address ("https://…/cpi/") are taken out. */
export function hasJargon(text: string, locale: Locale, allowed: readonly RegExp[] = ALLOWED): boolean {
  return JARGON[locale].test(allowed.reduce((rest, phrase) => rest.replace(phrase, ""), text.replace(/https?:\/\/\S+/g, "")));
}

export interface PlainRules {
  /** Words per sentence; 12 by default (about ten, with numbers counted once). */
  maxWords?: number;
  /** A longer limit for some texts (long-form pages), and which ones. */
  longForm?: { maxWords: number; paths: (path: string) => boolean };
  /** Texts that may use the technical words: the folded explanations. */
  technical?: (path: string) => boolean;
  /** Texts that are citations, not sentences to read (a source). */
  skip?: (path: string) => boolean;
  allowed?: readonly RegExp[];
}

/** Every problem in a language's texts: jargon and long sentences. Empty when they read plainly. */
export function plainLanguageProblems(entries: readonly TextEntry[], locale: Locale, rules: PlainRules = {}): string[] {
  const { maxWords = 12, longForm, technical = () => false, skip = () => false, allowed = ALLOWED } = rules;
  return entries.flatMap((entry) => {
    const found: string[] = [];
    if (!technical(entry.path) && hasJargon(entry.text, locale, allowed)) found.push(`${locale} ${entry.path}: jargon in "${entry.text}"`);
    if (!skip(entry.path)) {
      const max = longForm?.paths(entry.path) ? longForm.maxWords : maxWords;
      for (const sentence of sentences(entry.text)) {
        if (words(sentence) > max) found.push(`${locale} ${entry.path} (${words(sentence)} words): ${sentence}`);
      }
    }
    return found;
  });
}

/** A filled-in value: "X" wherever it is printed, 1 wherever it is counted. */
const VALUE: unknown = new Proxy(function value() {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? (hint: string) => (hint === "number" ? 1 : "X") : key === "length" ? 1 : VALUE),
  apply: () => VALUE,
});

/**
 * Every text of a dictionary object, with its path: strings as they are,
 * and functions called with filled-in values ("Open X", "X years"). Read
 * at run time, so an app needs no parser.
 */
export function textsOf(dictionary: unknown, path: string[] = []): TextEntry[] {
  if (typeof dictionary === "string") return /\p{L}{2}/u.test(dictionary) ? [{ path: path.join("."), text: dictionary }] : [];
  if (typeof dictionary === "function") {
    try {
      return textsOf((dictionary as (...args: unknown[]) => unknown)(...Array.from({ length: Math.max(1, dictionary.length) }, () => VALUE)), path);
    } catch {
      return [];
    }
  }
  if (Array.isArray(dictionary)) return dictionary.flatMap((item, index) => textsOf(item, [...path, String(index)]));
  if (dictionary && typeof dictionary === "object") return Object.entries(dictionary).flatMap(([key, value]) => textsOf(value, [...path, key]));
  return [];
}
