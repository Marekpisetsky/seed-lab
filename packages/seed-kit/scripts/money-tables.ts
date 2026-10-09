/**
 * Writes src/data/currencies.json (each country's currency) and
 * src/data/exchange-rates.json (each currency's official yearly rate per US
 * dollar), from the official data (src/official/money-tables.ts). Run after
 * the yearly official data:
 *
 *   npm run money-tables
 *
 * test/money.test.ts fails while the tables and the data disagree.
 */

import { writeFileSync } from "node:fs";
import { buildCurrencies, buildExchangeRates } from "../src/official/money-tables.ts";

const currencies = buildCurrencies();
writeFileSync(new URL("../src/data/currencies.json", import.meta.url), `${JSON.stringify(currencies, null, 1)}\n`);
const { rates, ...about } = buildExchangeRates();
// One line per currency: its years and rates.
const lines = Object.entries(rates).map(([currency, years]) => `  ${JSON.stringify(currency)}: ${JSON.stringify(years)}`);
writeFileSync(new URL("../src/data/exchange-rates.json", import.meta.url), `${JSON.stringify(about, null, 1).slice(0, -2)},\n "rates": {\n${lines.join(",\n")}\n }\n}\n`);
console.log(`${Object.keys(currencies).length} countries, ${Object.keys(rates).length} currencies with rates`);
