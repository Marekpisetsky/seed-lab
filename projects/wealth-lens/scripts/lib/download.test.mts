import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Instrument } from "../../src/lib/market-format.ts";
import { downloadInstrument } from "./download.mts";
import vwce from "./__fixtures__/yahoo-chart-vwce-de.json";

const STOOQ_CSV = readFileSync(new URL("./__fixtures__/stooq-vuaa-de.csv", import.meta.url), "utf8");

const VWCE: Instrument = {
  id: "VWCE",
  name: "Vanguard FTSE All-World",
  kind: "etf",
  index: "world",
  symbol: "VWCE.DE",
  stooq: "vwce.de",
  currency: "EUR",
};

/** A fake fetch answering by host, recording every URL it was asked for. */
function fakeFetch(answers: Record<string, () => Response>) {
  const calls: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const host = new URL(url).host;
    const answer = answers[host];
    if (!answer) throw new TypeError("fetch failed");
    return answer();
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const text = (body: string, status = 200) => () => new Response(body, { status });

describe("downloadInstrument", () => {
  it("uses Yahoo when it answers", async () => {
    const { fetchImpl, calls } = fakeFetch({ "query1.finance.yahoo.com": text(JSON.stringify(vwce)) });
    const result = await downloadInstrument(VWCE, { fetchImpl });
    expect(result).toMatchObject({ ok: true, source: "yahoo", currency: "EUR" });
    expect(result.ok && result.points).toHaveLength(6);
    expect(calls).toHaveLength(1);
  });

  it("tries Yahoo's second host, then falls back to Stooq", async () => {
    const { fetchImpl, calls } = fakeFetch({
      "query1.finance.yahoo.com": text("Too Many Requests", 429),
      "query2.finance.yahoo.com": text("<html>consent</html>"),
      "stooq.com": text(STOOQ_CSV),
    });
    const result = await downloadInstrument(VWCE, { fetchImpl });
    expect(result).toMatchObject({ ok: true, source: "stooq", currency: "EUR" });
    expect(calls.map((url) => new URL(url).host)).toEqual([
      "query1.finance.yahoo.com",
      "query2.finance.yahoo.com",
      "stooq.com",
    ]);
  });

  it("does not ask Yahoo's second host for a symbol Yahoo does not know", async () => {
    const notFound = JSON.stringify({ chart: { result: null, error: { code: "Not Found", description: "x" } } });
    const { fetchImpl, calls } = fakeFetch({ "query1.finance.yahoo.com": text(notFound, 404), "stooq.com": text("No data") });
    const result = await downloadInstrument(VWCE, { fetchImpl });
    expect(result.ok).toBe(false);
    expect(calls.map((url) => new URL(url).host)).toEqual(["query1.finance.yahoo.com", "stooq.com"]);
  });

  it("collects every reason when all sources fail, including network errors", async () => {
    const { fetchImpl } = fakeFetch({ "query2.finance.yahoo.com": text("Service Unavailable", 503) });
    const result = await downloadInstrument(VWCE, { fetchImpl });
    expect(result).toEqual({
      ok: false,
      errors: [
        expect.stringMatching(/^Yahoo \(query1.*UPSTREAM_ERROR, request failed/),
        expect.stringMatching(/^Yahoo \(query2.*UPSTREAM_ERROR, Yahoo answered with HTTP 503/),
        expect.stringMatching(/^Stooq \(vwce.de\): UPSTREAM_ERROR/),
      ],
    });
  });

  it("skips Stooq for instruments it does not list", async () => {
    const { fetchImpl, calls } = fakeFetch({});
    await downloadInstrument({ ...VWCE, stooq: null }, { fetchImpl });
    expect(calls.every((url) => url.includes("yahoo"))).toBe(true);
  });
});
