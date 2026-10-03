/**
 * Light, dark or automatic (the device's own mode, the default), for every
 * seed-lab app, chosen in the header (chrome.ts). The choice is the one
 * thing an app keeps in the browser, and only for the tab: one key in
 * sessionStorage, which the browser deletes when the tab is closed. It is
 * never sent, and "Automatic" deletes it at once. The privacy pages say so
 * (legal.ts).
 *
 * <html data-theme="auto|light|dark"> carries it: tokens.css gives the
 * colours of each, chrome.css shows the matching icon. A script in the
 * head sets it before anything is painted, so a page never flashes in the
 * other mode. Without scripts there is no attribute and no menu, and the
 * page follows the device.
 */

export const THEMES = ["auto", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** The sessionStorage key: checks.ts allows this one and no other, so the code below writes it out. */
export const THEME_KEY = "sk-theme";

/** The browser bar's colour for a fixed mode: the near-black and the white of the header. */
export const THEME_COLORS = { light: "#ffffff", dark: "#0a0a0a" } as const;

export const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

/** The mode the page is in now (<html data-theme>); "auto" before the head script, on the server too. */
export function currentTheme(): Theme {
  const theme = typeof document === "undefined" ? undefined : document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : "auto";
}

/** Calls `onChange` whenever the mode changes, from any copy of the menu. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The tab's choice; "auto" when there is none, or storage is blocked. */
export function readTheme(): Theme {
  try {
    const stored = sessionStorage.getItem("sk-theme");
    return stored === "light" || stored === "dark" ? stored : "auto";
  } catch {
    return "auto";
  }
}

/** The page in that mode, kept for the tab ("auto" keeps nothing). */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    if (theme === "auto") sessionStorage.removeItem("sk-theme");
    else sessionStorage.setItem("sk-theme", theme);
  } catch {
    // Blocked storage: the mode still changes, for this page.
  }
  barColor(theme);
}

/** A page with a fixed bar colour (the hub's dark top band) follows a fixed mode too. */
function barColor(theme: Theme): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  meta.dataset.auto ??= meta.content;
  meta.content = theme === "auto" ? meta.dataset.auto : THEME_COLORS[theme];
}

/**
 * The head script, before anything is painted: the tab's choice on <html>.
 * With `menu` (apps without a framework), it also runs the header's menus
 * once the page is there: a radio button with [data-sk-theme] changes the
 * mode, and every copy of the menu and the bar colour follow; one menu
 * (theme or tools) open at a time, closed by Escape or a press outside.
 * React apps do the same in react/chrome.tsx.
 */
export function themeScript({ menu = false }: { menu?: boolean } = {}): string {
  const read = `var r=document.documentElement,t="auto";try{var s=sessionStorage.getItem("sk-theme");if(s==="light"||s==="dark")t=s}catch(e){}r.dataset.theme=t;`;
  if (!menu) return `(function(){${read}})();`;
  const show = `var c=${JSON.stringify(THEME_COLORS)};function show(t){r.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m){if(m.dataset.auto===undefined)m.dataset.auto=m.content;m.content=t==="auto"?m.dataset.auto:c[t]}var x=document.querySelectorAll("input[data-sk-theme]");for(var i=0;i<x.length;i++)x[i].checked=x[i].value===t}`;
  const change = `document.addEventListener("change",function(e){var i=e.target;if(!i||!i.hasAttribute||!i.hasAttribute("data-sk-theme"))return;try{if(i.value==="auto")sessionStorage.removeItem("sk-theme");else sessionStorage.setItem("sk-theme",i.value)}catch(e){}show(i.value)});document.addEventListener("DOMContentLoaded",function(){show(r.dataset.theme)});`;
  const menus = `function open(){return document.querySelectorAll(".sk-header details[open]")}document.addEventListener("toggle",function(e){var d=e.target,o=open();if(!d.open||!d.closest||!d.closest(".sk-header"))return;for(var i=0;i<o.length;i++)if(o[i]!==d)o[i].open=false},true);document.addEventListener("keydown",function(e){var o=open();if(e.key!=="Escape"||!o.length)return;o[0].open=false;o[0].querySelector("summary").focus()});document.addEventListener("pointerdown",function(e){var o=open();for(var i=0;i<o.length;i++)if(!o[i].contains(e.target))o[i].open=false});`;
  return `(function(){${read}${show}${change}${menus}})();`;
}
