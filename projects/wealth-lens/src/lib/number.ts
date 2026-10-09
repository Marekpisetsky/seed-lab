/**
 * Reading a number the way people type it: "1.234,5", "1,234.5", "€ 2 500",
 * "−3 %", "1,50,000" (India), "150’000" (Switzerland). The decimal separator is whichever of "," and "." comes last;
 * a lone "," is a thousands separator only in a clear "1,234,567" shape.
 */

export function parseLooseNumber(raw: string | undefined, decimalComma = false): number | null {
  if (raw === undefined) return null;
  // The true minus sign (−) too: the app writes negatives with it (seed-kit's format.ts).
  // Spaces and apostrophes group thousands too: "2 500", "150'000", Swiss "150’000" (U+2019) or "150ʼ000".
  let text = raw.trim().replace(/[\s\u00a0\u202f'\u2019\u02bc]/g, "").replace(/\u2212/g, "-");
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
    // India groups by lakhs and crores: "1,50,000", "1,00,00,000".
    const lakhs = /^[1-9]\d?(,\d{2})+,\d{3}$/.test(unsigned);
    const isThousands = lakhs || (decimalComma ? /^[1-9]\d{0,2}(,\d{3}){2,}$/.test(unsigned) : /^[1-9]\d{0,2}(,\d{3})+$/.test(unsigned));
    text = isThousands ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (lastDot !== -1 && (decimalComma ? /^[+-]?[1-9]\d{0,2}(\.\d{3})+$/ : /^[+-]?[1-9]\d{0,2}(\.\d{3}){2,}$/).test(text)) {
    // "1.234.567": dots can only be thousands separators when there are several.
    text = text.replace(/\./g, "");
  }

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}
