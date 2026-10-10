/**
 * Why a higher return does not raise the withdrawal rate the past data
 * back as much: one line, in every language, for any tool that shows a
 * rate from withdrawal-rate.ts. Apart from the other words, so a page's
 * code holds only this line (the owner's wording, in three short
 * sentences).
 */

import type { Locale } from "../locales.ts";

export const WITHDRAWAL_WHY: Readonly<Record<Locale, string>> = {
  en: "More return usually brings bigger falls. A fall early in retirement forces you to sell low. So the safe rate does not rise as much.",
  es: "Más rentabilidad suele traer caídas más fuertes. Una caída al principio del retiro obliga a vender barato. Por eso la tasa segura no sube igual.",
  // PENDING REVIEW BY A NATIVE SPEAKER.
  nl: "Meer rendement brengt meestal grotere dalingen. Een daling vroeg in je pensioen dwingt je goedkoop te verkopen. Daarom stijgt het veilige percentage niet even hard.",
};
