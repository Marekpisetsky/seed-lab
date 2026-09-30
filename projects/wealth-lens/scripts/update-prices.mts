/**
 * Daily price job, run by the GitHub Action in scripts/update-prices.workflow.yml
 * (or by hand: `npm run update-prices`, which needs internet access).
 *
 * For every instrument in src/data/instruments.json it downloads ten years of
 * daily closes (Yahoo Finance, Stooq as fallback) and writes only figures
 * worked out from them into public/data/prices.json: the latest close, the
 * change over a year, past growth, the worst fall, how much it moves
 * (volatility, calendar-year changes; scripts/lib/stats.mts) and, at the end,
 * the weekly correlations between instruments. The closes themselves are
 * never published: the sources' terms do not allow passing their data on.
 * A folder of daily histories left by earlier versions is removed.
 *
 * When an instrument cannot be downloaded, or the download looks wrong, its
 * previous figures are kept untouched (and the correlations, unless every
 * instrument came in fresh). The file is only rewritten when its content
 * changes, so a day without new closes leaves the tree clean and the Action
 * commits nothing. The job never fails because a source is down: it logs a
 * warning and exits 0.
 */

import { readFile, rm, writeFile } from "node:fs/promises";
import { parseCatalogue, parsePricesFile, type InstrumentPrices } from "../src/lib/market-format.ts";
import { downloadInstrument } from "./lib/download.mts";
import { checkSeries, formatPricesFile, HISTORY_YEARS, lastYears, nextPricesFile, summarize } from "./lib/price-files.mts";
import type { PricePoint } from "./lib/series.mts";
import { instrumentStats, weeklyCorrelations } from "./lib/stats.mts";

const root = new URL("../", import.meta.url);
const catalogueUrl = new URL("src/data/instruments.json", root);
const pricesUrl = new URL("public/data/prices.json", root);
/** Daily histories an earlier version published; removed on the next run. */
const oldHistoryDir = new URL("public/data/history/", root);

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
  const series: Record<string, PricePoint[]> = {};
  const report: string[] = [];

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
        fresh[instrument.id] = { ...summarize(instrument, points, download.source), stats: instrumentStats(points) };
        series[instrument.id] = points;
        const { date, close } = fresh[instrument.id];
        console.log(`${instrument.id}: ${points.length} closes from ${download.source}, last ${close} on ${date}`);
        report.push(`| ${instrument.id} | ${close} ${instrument.currency} on ${date} | ${download.source}, ${points.length} closes |`);
      }
    }
    await pause(500); // be gentle with free sources
  }

  await rm(oldHistoryDir, { recursive: true, force: true });

  // Correlations need every series of the day; with one missing, yesterday's are kept.
  const everyone = instruments.every((instrument) => instrument.id in series);
  const correlations = everyone ? weeklyCorrelations(series) : (previous.correlations ?? null);
  const { file, changed } = nextPricesFile(instruments, previous, fresh, now, correlations);
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
