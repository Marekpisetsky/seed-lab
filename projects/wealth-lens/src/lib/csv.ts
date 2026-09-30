/**
 * Minimal RFC 4180 CSV reader, plus helpers for the messy files people
 * actually export: byte-order marks, CRLF line endings, `;` or tab
 * delimiters, quoted fields spanning lines, and numbers with thousands
 * separators or decimal commas.
 */

export interface CsvRecord {
  /** 1-based line number where the record starts, for error messages. */
  line: number;
  fields: string[];
}

export interface CsvTable {
  delimiter: string;
  header: string[];
  records: CsvRecord[];
}

const CANDIDATE_DELIMITERS = [",", ";", "\t"] as const;

/** Picks the delimiter that appears most often (outside quotes) in the first line. */
export function detectDelimiter(text: string): string {
  const counts = new Map<string, number>(CANDIDATE_DELIMITERS.map((d) => [d, 0]));
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === "\n" || char === "\r")) break;
    else if (!inQuotes && counts.has(char)) counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let best = ",";
  for (const [delimiter, count] of counts) {
    if (count > (counts.get(best) ?? 0)) best = delimiter;
  }
  return best;
}

/** Splits CSV text into records. Blank lines are skipped. */
export function parseCsvRecords(text: string, delimiter = detectDelimiter(text)): CsvRecord[] {
  const input = text.startsWith("﻿") ? text.slice(1) : text;
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endField = () => {
    fields.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    const isBlank = fields.length === 1 && fields[0].trim() === "";
    if (!isBlank) records.push({ line: recordLine, fields });
    fields = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") line++;
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      endRecord();
      line++;
      recordLine = line;
    } else {
      field += char;
    }
  }
  if (field !== "" || fields.length > 0) endRecord();
  return records;
}

/** First record is the header; the rest are data records. */
export function parseCsv(text: string): CsvTable {
  const delimiter = detectDelimiter(text);
  const [headerRecord, ...records] = parseCsvRecords(text, delimiter);
  return {
    delimiter,
    header: (headerRecord?.fields ?? []).map((name) => name.trim()),
    records,
  };
}

/**
 * Header name → comparison key: lower case, letters and digits only.
 * "No. of shares" → "noofshares", "Currency (Price / share)" → "currencypriceshare".
 */
export function normalizeHeader(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Index of the first header whose normalized name matches, or -1. */
export function findColumn(header: readonly string[], ...candidates: (string | RegExp)[]): number {
  const normalized = header.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.findIndex((name) =>
      typeof candidate === "string" ? name === candidate : candidate.test(name),
    );
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parses a number written by a human or a spreadsheet: "1234.5", "1,234.50",
 * "1.234,50", "1234,5", "€ 1 234", "-12.5%". Returns `null` if it is not one.
 *
 * With a single separator kind, a comma followed by exactly three digits in
 * every group is read as thousands ("1,234" → 1234) unless the number starts
 * with "0," ("0,123" → 0.123); any other comma is a decimal comma. With
 * `decimalComma` (a page in a language that writes 1.234,5, like Spanish) it
 * is the other way round: "10.000" is ten thousand and "1,234" is 1.234.
 */
export function parseLooseNumber(raw: string | undefined, decimalComma = false): number | null {
  if (raw === undefined) return null;
  let text = raw.trim().replace(/[\s  ']/g, "");
  text = text.replace(/^[^\d.,+-]+|[^\d.,]+$/g, ""); // currency symbols, %, codes
  if (text === "" || !/^[+-]?[\d.,]+$/.test(text)) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Both present: whichever comes last is the decimal separator.
    text =
      lastComma > lastDot
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const unsigned = text.replace(/^[+-]/, "");
    const isThousands = decimalComma ? /^[1-9]\d{0,2}(,\d{3}){2,}$/.test(unsigned) : /^[1-9]\d{0,2}(,\d{3})+$/.test(unsigned);
    text = isThousands ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (lastDot !== -1 && (decimalComma ? /^[+-]?[1-9]\d{0,2}(\.\d{3})+$/ : /^[+-]?[1-9]\d{0,2}(\.\d{3}){2,}$/).test(text)) {
    // "1.234.567": dots can only be thousands separators when there are several.
    text = text.replace(/\./g, "");
  }

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}
