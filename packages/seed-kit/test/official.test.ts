import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { currencies, economiesFromCldr } from "../src/official/cldr.ts";
import { COUNTRIES, OFFICIAL, sourcesOf, type SeriesId } from "../src/official/data.ts";
import { EU27, fromJsonStat } from "../src/official/eurostat.ts";
import { checkSeries, compareSeries, dataYearOf, latest, round, SPECS, toRow, valueIn, type OfficialSeries } from "../src/official/series.ts";
import { divide, economies, fromMirrorCsv, licenseOf, observations, rows } from "../src/official/worldbank.ts";

const meta = (id: string, dataYear: number) => ({
  id,
  title: "t",
  unit: "u",
  source: "World Bank, World Development Indicators",
  codes: ["X"],
  url: "https://data.worldbank.org",
  api: "https://api.worldbank.org",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  retrievedOn: "2026-10-09",
  dataYear,
});

/** A series of `count` made-up countries, each with `values` from 2020. */
function fake(id: string, values: (number | null)[], count = 160): OfficialSeries {
  const rowsOf = Object.fromEntries(Array.from({ length: count }, (_, index) => [`${String.fromCharCode(65 + Math.floor(index / 26))}${String.fromCharCode(65 + (index % 26))}`, [2020, ...values] as [number, ...(number | null)[]]]));
  return { meta: meta(id, dataYearOf(rowsOf)), values: rowsOf };
}

const TODAY = new Date("2026-10-09T00:00:00Z");

describe("official data: rows", () => {
  it("keeps a first year, then one figure a year, null in the gaps, trimmed at both ends", () => {
    const row = toRow(new Map([[2021, 1.23456789], [2023, 2]]), 4);
    assert.deepEqual(row, [2021, 1.235, null, 2]);
    assert.equal(valueIn(row ?? undefined, 2023), 2);
    assert.equal(valueIn(row ?? undefined, 2022), null);
    assert.equal(valueIn(row ?? undefined, 2030), null);
    assert.deepEqual(latest(row ?? undefined), { year: 2023, value: 2 });
    assert.deepEqual(latest(row ?? undefined, 2022), { year: 2021, value: 1.235 });
    assert.equal(toRow(new Map(), 4), null);
    assert.equal(round(123456, 2), 120000);
  });

  it("dates a series by the latest year that most countries have", () => {
    const values = { AA: [2020, 1, 2, 3] as [number, ...number[]], BB: [2020, 1, 2] as [number, ...number[]], CC: [2020, 1, 2] as [number, ...number[]] };
    assert.equal(dataYearOf(values), 2021);
  });
});

describe("official data: checks", () => {
  it("passes a series that makes sense", () => {
    assert.deepEqual(checkSeries(fake("wb-fx", [1, 1.1, 1.2, 1.3, 1.4, 1.5]), TODAY).errors, []);
  });

  it("stops on too few countries, a value out of range, a future year, a missing licence or an old data year", () => {
    assert.match(checkSeries(fake("wb-fx", [1, 1], 10), TODAY).errors.join(), /fewer than 150/);
    assert.match(checkSeries(fake("wb-price-level", [1, 50, 1, 1, 1, 1]), TODAY).errors.join(), /outside/);
    assert.match(checkSeries(fake("wb-fx", [1, 1, 1, 1, 1, 1, 1, 1]), TODAY).errors.join(), /years still to come/);
    const unlicensed = fake("wb-fx", [1, 1, 1, 1, 1, 1]);
    unlicensed.meta.license = "All rights reserved";
    assert.match(checkSeries(unlicensed, TODAY).errors.join(), /licence/);
    const old = fake("wb-fx", [1]);
    old.values = Object.fromEntries(Object.entries(old.values).map(([code]) => [code, [2015, 1]]));
    old.meta.dataYear = 2015;
    assert.match(checkSeries(old, TODAY).errors.join(), /more than 4 years old/);
    const lying = fake("wb-fx", [1, 1, 1, 1, 1, 1]);
    lying.meta.dataYear = 2024;
    assert.match(checkSeries(lying, TODAY).errors.join(), /dataYear says 2024/);
  });

  it("lists a jump on a first download, stops on a new one, and lets hyperinflation through", () => {
    const jump = fake("wb-fx", [1, 1, 100, 100, 100, 100]);
    assert.deepEqual(checkSeries(jump, TODAY).errors, []);
    assert.match(checkSeries(jump, TODAY).warnings.join(), /jumps ×100/);
    const before = fake("wb-fx", [1, 1, 1.1]);
    assert.match(checkSeries(jump, TODAY, undefined, before).errors.join(), /new since the series in use/);
    const known = fake("wb-fx", [1, 1, 100]);
    assert.deepEqual(checkSeries(jump, TODAY, undefined, known).errors, []);
    const prices = fake("wb-inflation", [0, 0, 9000, 0, 0, 0]);
    assert.deepEqual(checkSeries(jump, TODAY, prices, before).errors, []);
  });

  it("never takes fewer countries or an older year than the data in use, and lists big revisions", () => {
    const before = fake("wb-fx", [1, 1, 1, 1, 1, 1]);
    assert.match(compareSeries(before, fake("wb-fx", [1, 1, 1, 1, 1, 1], 150)).errors.join(), /fewer than the 160/);
    assert.match(compareSeries(before, fake("wb-fx", [1, 1, 1])).errors.join(), /older than/);
    assert.match(compareSeries(before, fake("wb-fx", [1, 2, 1, 1, 1, 1])).warnings.join(), /revised a lot/);
    assert.deepEqual(compareSeries(before, fake("wb-fx", [1, 1.1, 1, 1, 1, 1, 1])), { errors: [], warnings: [] });
  });
});

describe("official data: reading the sources", () => {
  const list = economies([
    { page: 1, pages: 1 },
    [
      { id: "NLD", iso2Code: "NL", name: "Netherlands", region: { id: "ECS", value: "Europe & Central Asia" }, incomeLevel: { id: "HIC" } },
      { id: "WLD", iso2Code: "1W", name: "World", region: { id: "NA", value: "Aggregates" } },
      { id: "PER", iso2Code: "PE", name: "Peru", region: { id: "LCN" }, incomeLevel: { id: "UMC" } },
    ],
  ]);

  it("keeps the World Bank's economies and drops its regions and groups", () => {
    assert.deepEqual([...list.keys()], ["NL", "PE"]);
    assert.throws(() => economies([{ message: [{ value: "Invalid" }] }]), /not a data answer/);
    assert.throws(() => economies([{ pages: 2 }, []]), /2 pages/);
  });

  it("reads an indicator by country and year, and refuses another indicator", () => {
    const answer = [
      { pages: 1 },
      [
        { indicator: { id: "PA.NUS.FCRF" }, country: { id: "NL" }, countryiso3code: "NLD", date: "2024", value: 0.924 },
        { indicator: { id: "PA.NUS.FCRF" }, country: { id: "1W" }, countryiso3code: "WLD", date: "2024", value: 1 },
        { indicator: { id: "PA.NUS.FCRF" }, country: { id: "PE" }, countryiso3code: "PER", date: "2024", value: null },
      ],
    ];
    const read = observations(answer, "PA.NUS.FCRF", list);
    assert.deepEqual(rows(read, 6), { NL: [2024, 0.924] });
    assert.throws(() => observations(answer, "FP.CPI.TOTL.ZG", list), /asked for FP.CPI.TOTL.ZG/);
    assert.deepEqual([...divide(new Map([["NL", new Map([[2024, 10]])]]), new Map([["NL", new Map([[2024, 4]])]])).get("NL") ?? []], [[2024, 2.5]]);
  });

  it("reads the public mirror's CSV, names with commas included", () => {
    const csv = 'Country Name,Country Code,Year,Value\nNetherlands,NLD,2024,0.92\n"Korea, Rep.",KOR,2024,1364\nWorld,WLD,2024,1\nPeru,PER,2023,\n';
    const read = fromMirrorCsv(csv, new Map([...list, ["KR", { iso2: "KR", iso3: "KOR", region: "", income: "", name: "" }]]));
    assert.deepEqual(rows(read, 6), { KR: [2024, 1364], NL: [2024, 0.92] });
    assert.throws(() => fromMirrorCsv("a,b\n", list), /columns/);
  });

  it("finds an indicator's licence in the World Bank's metadata", () => {
    const answer = { source: [{ concept: [{ id: "Series", variable: [{ id: "X", concept: [{ id: "License_Type", value: "CC BY-4.0" }, { id: "License_URL", value: "https://datacatalog.worldbank.org/public-licenses#cc-by" }] }] }] }] };
    assert.deepEqual(licenseOf(answer), { type: "CC BY-4.0", url: "https://datacatalog.worldbank.org/public-licenses#cc-by" });
    assert.equal(licenseOf({}), null);
  });

  it("reads Eurostat's JSON-stat, Greece and the EU under their ISO codes", () => {
    const stat = {
      id: ["unit", "geo", "time"],
      size: [1, 2, 3],
      dimension: { unit: { category: { index: { RCH_A_AVG: 0 } } }, geo: { category: { index: { EL: 0, EU27_2020: 1 } } }, time: { category: { index: { "2022": 0, "2023": 1, "2024": 2 } } } },
      value: { "0": 9.3, "2": 3, "4": 6.4, "5": 2.6 },
    };
    assert.deepEqual(fromJsonStat(stat), { GR: [2022, 9.3, null, 3], EU: [2023, 6.4, 2.6] });
  });

  it("takes each country's currency in use today from the CLDR, and its ISO codes", () => {
    const data = {
      supplemental: {
        currencyData: {
          region: {
            BG: [{ BGN: { _from: "1999-07-05", _to: "2026-01-01" } }, { EUR: { _from: "2026-01-01" } }],
            PA: [{ PAB: { _from: "1903-11-04" } }, { USD: { _from: "1904-05-18" } }],
            CU: [{ CUC: { _from: "1994-01-01", _tender: "false" } }, { CUP: { _from: "1859-01-01" } }],
          },
        },
      },
    };
    const money = currencies(data, TODAY);
    assert.equal(money.get("BG"), "EUR");
    assert.equal(currencies(data, new Date("2025-06-01")).get("BG"), "BGN");
    assert.equal(money.get("PA"), "USD");
    assert.equal(money.get("CU"), "CUP");
    const codes = economiesFromCldr({ supplemental: { codeMappings: { NL: { _alpha3: "NLD" }, ZZ: { _alpha3: "ZZZ" }, "001": {} } } });
    assert.deepEqual([...codes.keys()], ["NL", "XK"]);
  });
});

describe("the official data in this build", () => {
  const ids = Object.keys(OFFICIAL) as SeriesId[];

  it("has every series, each passing its checks, with its source, licence and dates", () => {
    assert.deepEqual(ids.sort(), SPECS.map((spec) => spec.id).sort());
    for (const id of ids) {
      const series = OFFICIAL[id];
      assert.deepEqual(checkSeries(series, TODAY, OFFICIAL["wb-inflation"]).errors, [], id);
      assert.match(series.meta.retrievedOn, /^\d{4}-\d{2}-\d{2}$/, id);
      assert.ok(series.meta.dataYear >= 2021, `${id}: data year ${series.meta.dataYear}`);
    }
    assert.equal(sourcesOf(["wb-fx"])[0].license, "CC BY 4.0");
  });

  it("names every country it has figures for, with a currency", () => {
    for (const id of ids) {
      for (const code of Object.keys(OFFICIAL[id].values)) {
        if (code === "EA" || code === "EU") continue;
        assert.ok(COUNTRIES[code], `${id}: ${code} is not in countries.json`);
      }
    }
    assert.ok(Object.keys(COUNTRIES).length >= 190);
    for (const [code, info] of Object.entries(COUNTRIES)) assert.match(info.currency ?? "", /^[A-Z]{3}$/, code);
  });

  it("uses Eurostat for the European Union only, and the euro in the euro area", () => {
    const eurostat = Object.keys(OFFICIAL["eurostat-hicp"].values);
    for (const code of eurostat) assert.ok(code === "EA" || code === "EU" || (EU27 as readonly string[]).includes(code), code);
    assert.equal(eurostat.length, 29);
    for (const code of ["NL", "ES", "DE", "FR", "IT", "PT", "HR", "BG"]) {
      assert.equal(COUNTRIES[code].currency, "EUR", code);
      assert.equal(COUNTRIES[code].eu, true, code);
    }
    assert.equal(COUNTRIES.US.currency, "USD");
    assert.equal(COUNTRIES.PE.currency, "PEN");
  });

  it("holds figures that agree with what is known about them", () => {
    // The US dollar is the World Bank's yardstick: one dollar per dollar, and US prices = 1.
    assert.equal(latest(OFFICIAL["wb-fx"].values.US)?.value, 1);
    assert.ok(Math.abs((latest(OFFICIAL["wb-price-level"].values.US)?.value ?? 0) - 1) < 0.01);
    // A euro is worth more than a dollar: fewer euros per dollar.
    const euro = latest(OFFICIAL["wb-fx"].values.NL)?.value ?? 0;
    assert.ok(euro > 0.7 && euro < 1.2, String(euro));
    // Prices: Switzerland above the US, India far below.
    assert.ok((latest(OFFICIAL["wb-price-level"].values.CH)?.value ?? 0) > 1);
    assert.ok((latest(OFFICIAL["wb-price-level"].values.IN)?.value ?? 1) < 0.4);
    // 2022's inflation in the Netherlands, high in both sources.
    assert.ok((valueIn(OFFICIAL["wb-inflation"].values.NL, 2022) ?? 0) > 9);
    assert.ok((valueIn(OFFICIAL["eurostat-hicp"].values.NL, 2022) ?? 0) > 9);
  });

  it("says which series are provisional, and why", () => {
    for (const id of ids) {
      const { provisional } = OFFICIAL[id].meta;
      if (provisional !== undefined) assert.ok(provisional.length > 40, id);
    }
  });
});

describe("the yearly workflow", () => {
  const workflow = readFileSync(new URL("../scripts/official-data.workflow.yml", import.meta.url), "utf8");

  it("runs once a year and by hand, the download it ships with", () => {
    assert.match(workflow, /cron: "\d+ \d+ 1 7 \*"/);
    assert.match(workflow, /workflow_dispatch/);
    assert.match(workflow, /node --experimental-strip-types scripts\/official-data\.ts/);
  });

  it("only opens a pull request, with the report, and keeps the data if anything fails", () => {
    assert.match(workflow, /gh pr create .*--body-file src\/data\/official\/REPORT\.md/);
    assert.match(workflow, /git checkout -- src\/data\/official\/\*\.json/);
    assert.doesNotMatch(workflow, /git push origin (master|main)|gh pr merge/);
  });
});
