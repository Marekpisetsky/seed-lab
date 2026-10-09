import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";
import { CHROME_WORDS, headerModel } from "../src/chrome.ts";
import { headerHtml } from "../src/chrome-html.ts";
import { storageUse } from "../src/checks.ts";
import { THEME_COLORS, THEME_KEY, THEMES, themeScript } from "../src/theme.ts";

/** A page with just enough of a browser for the theme script: <html>, the bar colour, two copies of the menu, the tab's storage. */
function browser(stored: string | null, { blocked = false } = {}) {
  const store = new Map<string, string>(stored === null ? [] : [[THEME_KEY, stored]]);
  const listeners: Record<string, ((event: unknown) => void)[]> = {};
  const radios = ["bar", "panel"].flatMap((copy) => THEMES.map((value) => ({ copy, value, checked: value === "auto", hasAttribute: (name: string) => name === "data-sk-theme" })));
  const meta = { content: "#0a0a0a", dataset: {} as Record<string, string> };
  const html = { dataset: {} as Record<string, string> };
  const sessionStorage = {
    getItem: (key: string) => {
      if (blocked) throw new Error("blocked");
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (blocked) throw new Error("blocked");
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
  };
  const document = {
    documentElement: html,
    querySelector: (selector: string) => (selector.includes("theme-color") ? meta : null),
    querySelectorAll: (selector: string) => (selector.includes("data-sk-theme") ? radios : []),
    addEventListener: (type: string, listener: (event: unknown) => void) => (listeners[type] ??= []).push(listener),
  };
  return {
    html,
    meta,
    radios,
    store,
    run: (code: string) => runInNewContext(code, { document, sessionStorage }),
    fire: (type: string, event: unknown = {}) => listeners[type]?.forEach((listener) => listener(event)),
  };
}

describe("the theme", () => {
  it("follows the device until a mode is picked, and keeps a pick for the tab only", () => {
    const page = browser(null);
    page.run(themeScript());
    assert.equal(page.html.dataset.theme, "auto");
    const kept = browser("dark");
    kept.run(themeScript());
    assert.equal(kept.html.dataset.theme, "dark");
    const odd = browser("purple");
    odd.run(themeScript());
    assert.equal(odd.html.dataset.theme, "auto", "anything else is ignored");
    const blocked = browser("light", { blocked: true });
    blocked.run(themeScript());
    assert.equal(blocked.html.dataset.theme, "auto", "blocked storage: the device's mode, and no error");
  });

  it("runs the menu without a framework: every copy and the bar colour follow, and Automatic deletes the key", () => {
    const page = browser(null);
    page.run(themeScript({ menu: true }));
    page.fire("DOMContentLoaded");
    const light = page.radios.find((radio) => radio.copy === "panel" && radio.value === "light");
    page.fire("change", { target: light });
    assert.equal(page.html.dataset.theme, "light");
    assert.equal(page.store.get(THEME_KEY), "light");
    assert.deepEqual(
      page.radios.filter((radio) => radio.checked).map((radio) => radio.copy),
      ["bar", "panel"],
      "both copies show it",
    );
    assert.equal(page.meta.content, THEME_COLORS.light);
    page.fire("change", { target: page.radios.find((radio) => radio.value === "auto") });
    assert.equal(page.html.dataset.theme, "auto");
    assert.equal(page.store.has(THEME_KEY), false);
    assert.equal(page.meta.content, "#0a0a0a", "the page's own bar colour comes back");
  });

  it("is the one thing the storage check allows", () => {
    assert.deepEqual(storageUse(themeScript({ menu: true })), []);
    assert.deepEqual(storageUse(`sessionStorage.setItem("${THEME_KEY}","dark")`), []);
    assert.deepEqual(storageUse('sessionStorage.setItem("plan","{}")'), ["sessionStorage"]);
    assert.deepEqual(storageUse("const key = 'sk-theme'; sessionStorage.setItem(key, 1)"), ["sessionStorage"], "only the key written out");
    assert.deepEqual(storageUse(`localStorage.setItem("${THEME_KEY}","dark")`), ["localStorage"]);
  });

  it("has a menu in the header with three modes, Automatic first, in two copies that never share a group", () => {
    for (const locale of ["en", "es"] as const) {
      const words = CHROME_WORDS[locale];
      const out = headerHtml(headerModel({ locale, name: "Tool", homeHref: "/", languageHrefs: { en: "/", es: "/es/", nl: "/nl/" }, current: "tool" })).value;
      assert.match(out, new RegExp(`<details class="sk-theme"><summary aria-label="${words.theme}" title="${words.theme}"`));
      const radios = [...out.matchAll(/<input type="radio" name="([^"]+)" value="(\w+)" data-sk-theme( checked)?>/g)];
      assert.equal(radios.length, 6);
      assert.deepEqual(radios.slice(0, 3).map(([, , value]) => value), [...THEMES]);
      assert.deepEqual(radios.filter(([, , , checked]) => checked).map(([, , value]) => value), ["auto", "auto"]);
      assert.equal(new Set(radios.map(([, name]) => name)).size, 2);
      for (const theme of THEMES) assert.ok(out.includes(`${words.themes[theme]}`), theme);
      assert.ok(out.includes(words.themeNote) && out.includes(words.themeAuto));
      assert.ok(out.indexOf('class="sk-theme"') < out.indexOf('class="sk-launcher"'), "beside EN/ES, before the tools");
    }
  });
});
