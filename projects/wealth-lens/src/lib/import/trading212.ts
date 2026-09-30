/**
 * Trading 212 "History → Export" CSV → open positions.
 *
 * The export is a list of transactions, not holdings, so positions are
 * rebuilt by replaying buys and sells in chronological order with the
 * average-cost method. Column names changed over the years (e.g. "Total (EUR)"
 * vs "Total" + "Currency (Total)"), so columns are matched by normalized name
 * and only the ones needed are required.
 *
 * Cost basis is kept in the instrument's price currency, the same currency its
 * quotes and charts use. When the transaction total is in that same currency
 * it is used as-is (it is what was really paid, fees included); otherwise the
 * cost is shares × price, because converting would need an FX rate.
 */

import { findColumn, parseLooseNumber, type CsvTable } from "../csv";
import { problem } from "../problems";
import type { IgnoredRows, ImportedPosition, ImportIssue, ImportOutcome } from "./types";

const EPSILON = 1e-9;

interface Columns {
  action: number;
  time: number;
  ticker: number;
  isin: number;
  shares: number;
  price: number;
  priceCurrency: number;
  total: number;
  totalCurrency: number;
  /** Currency taken from a legacy header such as "Total (EUR)". */
  totalCurrencyFromHeader: string | null;
}

export function isTrading212Header(header: readonly string[]): boolean {
  return findColumn(header, "action") !== -1 && findColumn(header, "noofshares") !== -1;
}

function resolveColumns(header: readonly string[]): Columns {
  const legacyTotal = header.map((name) => /^total\s*\(([a-z]{3})\)$/i.exec(name.trim())).find(Boolean);
  return {
    action: findColumn(header, "action"),
    time: findColumn(header, "time", "date", "datetime"),
    ticker: findColumn(header, "ticker"),
    isin: findColumn(header, "isin"),
    shares: findColumn(header, "noofshares"),
    price: findColumn(header, "priceshare", "pricepershare"),
    priceCurrency: findColumn(header, "currencypriceshare", "currencypricepershare"),
    total: findColumn(header, "total", /^total[a-z]{3}$/),
    totalCurrency: findColumn(header, "currencytotal"),
    totalCurrencyFromHeader: legacyTotal ? legacyTotal[1].toUpperCase() : null,
  };
}

interface TradeRow {
  line: number;
  kind: "buy" | "sell";
  time: number;
  fields: string[];
}

/**
 * Actions that never change how many shares are held. Dividend rows do fill
 * "No. of shares" (shares held at the payment date), so they must be listed
 * here rather than detected by an empty share count.
 */
const NON_POSITION_ACTIONS = [
  /^dividend\b/i,
  /interest/i,
  /^deposit$/i,
  /^withdrawal$/i,
  /^currency conversion$/i,
  /^card (debit|credit)$/i,
  /cashback/i,
  /^new card cost$/i,
  /^result adjustment$/i,
];

function classifyAction(action: string): "buy" | "sell" | "ignore" | "unsupported" {
  if (/\bbuy$/i.test(action)) return "buy";
  if (/\bsell$/i.test(action)) return "sell";
  if (NON_POSITION_ACTIONS.some((pattern) => pattern.test(action))) return "ignore";
  return "unsupported";
}

const round = (value: number, digits: number) => Number(value.toFixed(digits));

export function parseTrading212(table: CsvTable): ImportOutcome {
  const columns = resolveColumns(table.header);
  const missing = (
    [
      ["Ticker", columns.ticker === -1 && columns.isin === -1],
      ["Price / share", columns.price === -1],
      ["Currency (Price / share)", columns.priceCurrency === -1],
    ] as const
  )
    .filter(([, isMissing]) => isMissing)
    .map(([name]) => name);
  if (missing.length > 0) {
    return {
      ok: false,
      error: problem("t212-missing-columns", { columns: missing.join(", ") }),
    };
  }

  const issues: ImportIssue[] = [];
  const ignored = new Map<string | null, number>();
  const trades: TradeRow[] = [];
  const cell = (fields: string[], index: number) => (index === -1 ? "" : (fields[index] ?? "").trim());

  for (const { line, fields } of table.records) {
    const action = cell(fields, columns.action);
    const kind = classifyAction(action);
    // Unknown actions without a share count cannot change a position either.
    if (kind === "ignore" || (kind === "unsupported" && cell(fields, columns.shares) === "")) {
      const label = action || null;
      ignored.set(label, (ignored.get(label) ?? 0) + 1);
      continue;
    }
    if (kind === "unsupported") {
      issues.push({ line, problem: problem("t212-unsupported", { action }) });
      continue;
    }
    const time = Date.parse(cell(fields, columns.time).replace(" ", "T"));
    trades.push({ line, kind, time, fields });
  }

  // Replay in chronological order when every trade has a readable time;
  // otherwise trust the file order.
  if (trades.every((trade) => Number.isFinite(trade.time))) {
    trades.sort((a, b) => a.time - b.time || a.line - b.line);
  }

  const positions = new Map<string, ImportedPosition>();
  for (const { line, kind, fields } of trades) {
    const ticker = (cell(fields, columns.ticker) || cell(fields, columns.isin)).toUpperCase();
    const sharesRaw = cell(fields, columns.shares);
    const priceRaw = cell(fields, columns.price);
    const shares = parseLooseNumber(sharesRaw);
    const price = parseLooseNumber(priceRaw);
    const currency = cell(fields, columns.priceCurrency).toUpperCase();

    if (ticker === "") {
      issues.push({ line, problem: problem("missing-ticker") });
      continue;
    }
    if (shares === null || shares <= 0) {
      issues.push({ line, problem: problem("bad-shares", { ticker, raw: sharesRaw }) });
      continue;
    }
    if (price === null || price < 0) {
      issues.push({ line, problem: problem("bad-share-price", { ticker, raw: priceRaw }) });
      continue;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      issues.push({ line, problem: problem("bad-currency", { ticker, raw: currency }) });
      continue;
    }

    const position = positions.get(ticker);
    if (position && position.currency !== currency) {
      issues.push({ line, problem: problem("currency-differs", { ticker, currency, earlier: position.currency }) });
      continue;
    }

    if (kind === "buy") {
      const total = parseLooseNumber(cell(fields, columns.total));
      const totalCurrency =
        cell(fields, columns.totalCurrency).toUpperCase() || columns.totalCurrencyFromHeader;
      // Some export versions sign buy totals as negative (cash out).
      const paid = total === null ? 0 : Math.abs(total);
      const cost = paid > 0 && totalCurrency === currency ? paid : shares * price;
      const next = position ?? { ticker, quantity: 0, costBasis: 0, currency, currentPrice: null };
      next.quantity = round(next.quantity + shares, 10);
      next.costBasis += cost;
      positions.set(ticker, next);
      continue;
    }

    if (!position || shares > position.quantity + EPSILON) {
      const held = position?.quantity ?? 0;
      issues.push({ line, problem: problem("oversold", { ticker, shares, held }) });
      continue;
    }
    const averageCost = position.costBasis / position.quantity;
    position.quantity = round(position.quantity - shares, 10);
    position.costBasis -= averageCost * shares;
    if (position.quantity <= EPSILON) positions.delete(ticker);
  }

  const ignoredRows: IgnoredRows[] = [...ignored].map(([label, count]) => ({ label, count }));
  return {
    ok: true,
    format: "trading212",
    positions: [...positions.values()]
      .map((position) => ({ ...position, costBasis: round(position.costBasis, 6) }))
      .sort((a, b) => a.ticker.localeCompare(b.ticker)),
    issues: issues.sort((a, b) => a.line - b.line),
    ignored: ignoredRows,
    rowCount: table.records.length,
  };
}
