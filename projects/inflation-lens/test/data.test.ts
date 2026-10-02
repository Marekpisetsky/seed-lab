import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TOOLS } from "../../../packages/seed-kit/src/tools.ts";
import { fromJsonStat, HICP, parseHicp, seriesFor } from "../src/hicp.ts";
import { WORDS } from "../src/i18n.ts";
import { ID } from "../src/site.ts";

/**
 * Coherence checks on the data, above all while it is typed by hand
 * (provisional): every series whole and in range; each year, the euro
 * area and the EU close to the weighted average of their countries; the
 * figures that could be checked against a published source equal to it.
 */

const EU27 = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "GR", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"];
/** Euro area members, with the year they joined. */
const EURO: Readonly<Record<string, number>> = { BE: 1999, DE: 1999, IE: 1999, ES: 1999, FR: 1999, IT: 1999, LU: 1999, NL: 1999, AT: 1999, PT: 1999, FI: 1999, GR: 2001, SI: 2007, CY: 2008, MT: 2008, SK: 2009, EE: 2011, LV: 2014, LT: 2015, HR: 2023 };
/** Rough shares of each country in EU consumer spending, per thousand: enough to check an average, not to compute one. */
const WEIGHT: Readonly<Record<string, number>> = {
  DE: 270, FR: 165, IT: 135, ES: 100, NL: 45, BE: 30, AT: 27, IE: 15, FI: 15, PT: 17, GR: 17, SK: 7, SI: 4, LU: 3, LT: 4, LV: 2, EE: 2, CY: 2, MT: 1, HR: 6,
  PL: 50, RO: 20, CZ: 17, HU: 11, SE: 22, DK: 13, BG: 5,
};
const rate = (code: string, year: number) => {
  const series = HICP.series[code];
  return series ? series.rates[year - series.from] : undefined;
};

describe("the data", () => {
  it("has the euro area, the EU and its 27 countries, each with whole, sensible years", () => {
    assert.deepEqual(Object.keys(HICP.series).sort(), ["EA", "EU", ...EU27].sort());
    for (const [code, { from, rates }] of Object.entries(HICP.series)) {
      assert.ok(from >= 1996 && from + rates.length - 1 <= 2026, code);
      for (const value of rates) assert.equal(Math.round(value * 10) / 10, value, `${code}: one decimal`);
    }
  });

  it("says where it comes from, under which licence and when", () => {
    assert.match(HICP.source, /Eurostat/);
    assert.match(HICP.sourceUrl, /^https:\/\/ec\.europa\.eu\/eurostat\//);
    assert.match(HICP.license, /Creative Commons Attribution 4\.0/);
    assert.match(HICP.retrievedOn, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("puts the euro area and the EU close to the weighted average of their countries, every year", () => {
    const years = new Set(EU27.flatMap((code) => HICP.series[code].rates.map((_, index) => HICP.series[code].from + index)));
    for (const year of years) {
      const average = (members: string[]) => {
        const known = members.filter((code) => rate(code, year) !== undefined);
        const total = known.reduce((sum, code) => sum + WEIGHT[code], 0);
        return known.reduce((sum, code) => sum + WEIGHT[code] * (rate(code, year) as number), 0) / total;
      };
      const euro = average(Object.keys(EURO).filter((code) => EURO[code] <= year));
      const eu = average(EU27);
      assert.ok(Math.abs(euro - (rate("EA", year) as number)) <= 0.15, `${year}: euro area ${rate("EA", year)}, its countries ${euro.toFixed(2)}`);
      if (rate("EU", year) !== undefined) assert.ok(Math.abs(eu - (rate("EU", year) as number)) <= 0.45, `${year}: EU ${rate("EU", year)}, its countries ${eu.toFixed(2)}`);
      for (const group of ["EA", "EU"]) {
        const value = rate(group, year);
        const members = EU27.map((code) => rate(code, year)).filter((entry): entry is number => entry !== undefined);
        if (value !== undefined) assert.ok(value >= Math.min(...members) && value <= Math.max(...members), `${year}: ${group} inside its countries`);
      }
    }
  });

  it("averages about 1.7 % a year in the euro area from 1999 to 2019, as the ECB says", () => {
    const years = Array.from({ length: 21 }, (_, index) => 1999 + index);
    const mean = years.reduce((sum, year) => sum + (rate("EA", year) as number), 0) / years.length;
    assert.ok(Math.abs(mean - 1.7) <= 0.05, mean.toFixed(3));
  });

  it("matches every figure that could be checked against what Eurostat published", () => {
    // The EU, 2016-2024, and four countries in 2024: Eurostat, Statistics Explained, "Consumer prices - inflation" (2026).
    assert.deepEqual(HICP.series.EU.rates.slice(2016 - HICP.series.EU.from, 2024 - HICP.series.EU.from + 1), [0.2, 1.7, 1.9, 1.5, 0.7, 2.9, 9.2, 6.4, 2.6]);
    for (const [code, value] of [["BE", 4.3], ["HR", 4.0], ["RO", 5.8], ["IT", 1.1]] as const) assert.equal(rate(code, 2024), value, code);
  });

  it("while typed by hand, says so on the page and keeps the tool out of the hub and the launchers", () => {
    if (!HICP.provisional) return;
    assert.ok(HICP.provisionalNote);
    assert.equal(TOOLS.find((tool) => tool.id === ID)?.shown ?? false, false);
  });

  it("refuses a bad edit", () => {
    assert.throws(() => parseHicp({ ...HICP, license: "" }), /license/);
    assert.throws(() => parseHicp({ ...HICP, series: { ...HICP.series, XX: { from: 1990, rates: [1], checked: true } } }), /from must be a year/);
    assert.throws(() => parseHicp({ ...HICP, provisional: true, provisionalNote: undefined }), /says why/);
  });

  it("names every place in each language, the euro area and the EU first", () => {
    for (const locale of ["en", "es"] as const) {
      const all = seriesFor(locale, WORDS[locale].groups);
      assert.deepEqual(all.slice(0, 2).map((series) => series.code), ["EA", "EU"]);
      assert.equal(all.length, 29);
      for (const series of all) assert.notEqual(series.name, series.code, series.code);
    }
    assert.equal(seriesFor("es", WORDS.es.groups).find((series) => series.code === "GR")?.name, "Grecia");
  });
});

describe("Eurostat's own file (npm run data)", () => {
  it("reads the yearly rates out of its JSON-stat answer, with Eurostat's codes made ISO's", () => {
    // The shape of https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_aind (format=JSON).
    const answer = {
      version: "2.0",
      class: "dataset",
      id: ["freq", "unit", "coicop", "geo", "time"],
      size: [1, 1, 1, 3, 4],
      dimension: {
        freq: { category: { index: { A: 0 } } },
        unit: { category: { index: { RCH_A_AVG: 0 } } },
        coicop: { category: { index: { CP00: 0 } } },
        geo: { category: { index: { EA: 0, EL: 1, EU27_2020: 2 } } },
        time: { category: { index: { "1996": 0, "1997": 1, "1998": 2, "1999": 3 } } },
      },
      value: { "1": 1.6, "2": 1.1, "3": 1.1, "5": 5.4, "6": 4.5, "7": 2.1, "11": 1.2 },
    };
    assert.deepEqual(fromJsonStat(answer), {
      EA: { from: 1997, rates: [1.6, 1.1, 1.1], checked: true },
      GR: { from: 1997, rates: [5.4, 4.5, 2.1], checked: true },
      EU: { from: 1999, rates: [1.2], checked: true },
    });
    assert.throws(() => fromJsonStat({}), /not a dataset/);
  });
});
