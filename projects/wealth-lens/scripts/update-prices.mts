/**
 * Daily price job, run by the GitHub Action in scripts/update-prices.workflow.yml
 * (or by hand: `npm run update-prices`, which needs internet access).
 *
 * For every instrument in src/data/instruments.json it downloads ten years of
 * daily closes (Yahoo Finance, Stooq as fallback) and writes:
 *   public/data/prices.json          latest close, 12-month line, past growth
 *   public/data/history/<ID>.json    the full daily series, for the chart
 *
 * When an instrument cannot be downloaded, or the download looks wrong, its
 * previous data is kept untouched. Files are only rewritten when their
 * content changes, so a day without new closes leaves the tree clean and the
 * Action commits nothing. The job never fails because a source is down: it
 * logs a warning and exits 0.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { parseCatalogue, parsePricesFile, type InstrumentPrices } from "../src/lib/market-format.ts";
import { downloadInstrument } from "./lib/download.mts";
import {
  checkSeries,
  encodeHistory,
  formatPricesFile,
  HISTORY_YEARS,
  lastYears,
  nextPricesFile,
  summarize,
} from "./lib/price-files.mts";

const root = new URL("../", import.meta.url);
const catalogueUrl = new URL("src/data/instruments.json", root);
const pricesUrl = new URL("public/data/prices.json", root);
const historyDir = new URL("public/data/history/", root);

async function readJson(url: URL): Promise<unknown> {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch {
    return null;
  }
}

/** Writes only when the content differs; returns whether it did. */
async function writeIfChanged(url: URL, content: string): Promise<boolean> {
  const current = await readFile(url, "utf8").catch(() => null);
  if (current === content) return false;
  await writeFile(url, content);
  return true;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const { instruments } = parseCatalogue(await readJson(catalogueUrl));
  const previous = parsePricesFile(await readJson(pricesUrl));
  const now = new Date();
  const fresh: Record<string, InstrumentPrices> = {};
  const report: string[] = [];
  await mkdir(historyDir, { recursive: true });

  for (const instrument of instruments) {
    const download = await downloadInstrument(instrument);
    if (!download.ok) {
      console.log(`::warning::${instrument.id}: kept previous data. ${download.errors.join(" | ")}`);
      report.push(`| ${instrument.id} | kept previous | ${download.errors.join("<br>")} |`);
    } else {
      const points = lastYears(download.points, HISTORY_YEARS);
      const check = checkSeries(instrument, points, download.currency, previous.prices[instrument.id], now);
      if (!check.ok) {
        console.log(`::warning::${instrument.id}: kept previous data, ${download.source} answer rejected: ${check.reason}`);
        report.push(`| ${instrument.id} | kept previous | ${download.source}: ${check.reason} |`);
      } else {
        fresh[instrument.id] = summarize(instrument, points, download.source);
        const history = `${JSON.stringify(encodeHistory(instrument, points))}\n`;
        await writeIfChanged(new URL(`${encodeURIComponent(instrument.id)}.json`, historyDir), history);
        const { date, close } = fresh[instrument.id];
        console.log(`${instrument.id}: ${points.length} closes from ${download.source}, last ${close} on ${date}`);
        report.push(`| ${instrument.id} | ${close} ${instrument.currency} on ${date} | ${download.source}, ${points.length} closes |`);
      }
    }
    await pause(500); // be gentle with free sources
  }

  // History of instruments no longer in the list.
  const known = new Set(instruments.map((instrument) => `${encodeURIComponent(instrument.id)}.json`));
  for (const name of await readdir(historyDir)) {
    if (name.endsWith(".json") && !known.has(name)) await rm(new URL(name, historyDir));
  }

  const { file, changed } = nextPricesFile(instruments, previous, fresh, now);
  if (changed) await writeIfChanged(pricesUrl, formatPricesFile(file));

  const updated = Object.keys(fresh).length;
  const summary = `${updated} of ${instruments.length} instruments downloaded; prices file ${changed ? "updated" : "unchanged"}.`;
  console.log(summary);
  if (updated === 0) console.log("::warning::No instrument could be downloaded; the previous data is kept.");
  if (process.env.GITHUB_STEP_SUMMARY) {
    const table = ["| Instrument | Result | Details |", "| --- | --- | --- |", ...report].join("\n");
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `### Prices\n\n${summary}\n\n${table}\n`, { flag: "a" });
  }
}

main().catch((error: unknown) => {
  // Unexpected bug: report it, but never leave half-written data behind.
  console.log(`::error::Price job failed: ${String(error)}`);
  process.exitCode = 1;
});
