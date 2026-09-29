/**
 * A plain holdings CSV, one position per row, for brokers without a
 * supported export (or hand-made spreadsheets). Column names are matched
 * loosely; the cost can be given as a total or as an average price per share.
 *
 *   ticker,quantity,cost_basis,currency,current_price
 *   VWCE,12,1250.40,EUR,118.2
 */

import { findColumn, parseLooseNumber, type CsvTable } from "../csv";
import type { ImportedPosition, ImportIssue, ImportOutcome } from "./types";

export const SIMPLE_HOLDINGS_COLUMNS = "ticker, quantity, cost_basis (or avg_price), currency, current_price (optional)";

function resolveColumns(header: readonly string[]) {
  return {
    ticker: findColumn(header, "ticker", "symbol", "instrument"),
    quantity: findColumn(header, "quantity", "qty", "shares", "units", "noofshares"),
    costBasis: findColumn(header, "costbasis", "totalcost", "cost", "invested", "bookcost"),
    averagePrice: findColumn(
      header,
      "avgprice",
      "averageprice",
      "avgcost",
      "averagecost",
      "averagepricepershare",
    ),
    currency: findColumn(header, "currency", "ccy"),
    currentPrice: findColumn(header, "currentprice", "lastprice", "marketprice", "price"),
  };
}

export function isSimpleHoldingsHeader(header: readonly string[]): boolean {
  const columns = resolveColumns(header);
  return columns.ticker !== -1 && columns.quantity !== -1;
}

export function parseSimpleHoldings(table: CsvTable): ImportOutcome {
  const columns = resolveColumns(table.header);
  const missing = [
    columns.costBasis === -1 && columns.averagePrice === -1 ? "cost_basis or avg_price" : null,
    columns.currency === -1 ? "currency" : null,
  ].filter((name): name is string => name !== null);
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Holdings CSV is missing the column(s): ${missing.join(", ")}. Expected: ${SIMPLE_HOLDINGS_COLUMNS}.`,
    };
  }

  const positions: ImportedPosition[] = [];
  const issues: ImportIssue[] = [];
  const cell = (fields: string[], index: number) => (index === -1 ? "" : (fields[index] ?? "").trim());

  for (const { line, fields } of table.records) {
    const ticker = cell(fields, columns.ticker).toUpperCase();
    const quantityRaw = cell(fields, columns.quantity);
    const quantity = parseLooseNumber(quantityRaw);
    const currency = cell(fields, columns.currency).toUpperCase();
    const costBasisValue = parseLooseNumber(cell(fields, columns.costBasis));
    const averagePrice = parseLooseNumber(cell(fields, columns.averagePrice));
    const currentPriceRaw = cell(fields, columns.currentPrice);
    const currentPrice = currentPriceRaw === "" ? null : parseLooseNumber(currentPriceRaw);

    if (ticker === "") {
      issues.push({ line, message: "Missing ticker." });
      continue;
    }
    if (quantity === null || quantity <= 0) {
      issues.push({ line, message: `${ticker}: could not read the quantity ("${quantityRaw}").` });
      continue;
    }
    const costBasis =
      costBasisValue ?? (averagePrice === null ? null : averagePrice * quantity);
    if (costBasis === null || costBasis < 0) {
      issues.push({ line, message: `${ticker}: could not read the cost basis or average price.` });
      continue;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      issues.push({ line, message: `${ticker}: missing or invalid currency ("${currency}").` });
      continue;
    }
    if (currentPrice !== null && currentPrice < 0) {
      issues.push({ line, message: `${ticker}: current price cannot be negative.` });
      continue;
    }
    if (currentPriceRaw !== "" && currentPrice === null) {
      issues.push({ line, message: `${ticker}: could not read the current price ("${currentPriceRaw}").` });
      continue;
    }

    positions.push({ ticker, quantity, costBasis, currency, currentPrice });
  }

  return {
    ok: true,
    format: "holdings",
    positions,
    issues,
    ignored: [],
    rowCount: table.records.length,
  };
}
