/**
 * Reading a number the way people type it: "1.234,5", "1,234.5", "€ 2 500",
 * "−3 %". The decimal separator is whichever of "," and "." comes last;
 * a lone "," is a thousands separator only in a clear "1,234,567" shape.
 */

export function parseLooseNumber(raw: string | undefined, decimalComma = false): number | null {
  if (raw === undefined) return null;
  // The true minus sign (−) too: the app writes negatives with it (seed-kit's format.ts).
  let text = raw.trim().replace(/[\s  ']/g, "").replace(/\u2212/g, "-");
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
