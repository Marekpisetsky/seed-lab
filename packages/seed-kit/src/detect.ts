import { DEFAULT_LOCALE, PREFIXED_LOCALES } from "./locales.ts";

/**
 * The language script, for the <head> of every page, before anything is
 * painted. Nothing is stored: no cookie, no browser storage.
 *
 * - It tells the document which language the page is in (pages that share
 *   one layout write <html lang> once).
 * - On a first visit from outside the site to an English address, it sends
 *   the browser to the same page in the reader's language when the browser
 *   prefers one the site speaks (say, Spanish before English).
 *
 * A reload, going back, a link within the site or an address in another
 * language are left as they are, so a language picked with EN/ES stays
 * picked. `basePath` is the folder the site lives in, if any
 * ("/wealth-lens"): addresses are read after it. `folders`: the site's
 * pages are folders ("/es/", "/es/principles/"), so the home page in
 * another language keeps its trailing slash too.
 */
export function languageScript({ basePath = "", folders = false }: { basePath?: string; folders?: boolean } = {}): string {
  const home = folders ? "/" : "";
  return `(function(){var b=${JSON.stringify(basePath)},p=${JSON.stringify(PREFIXED_LOCALES)},d="${DEFAULT_LOCALE}",w=location.pathname,r=b&&w.indexOf(b)===0?w.slice(b.length)||"/":w,s=r.split("/")[1],c=p.indexOf(s)>=0?s:d;document.documentElement.lang=c;if(c!==d)return;try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type!=="navigate")return;if(document.referrer&&new URL(document.referrer).origin===location.origin)return;var l=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<l.length;i++){var x=String(l[i]).slice(0,2).toLowerCase();if(x===d)return;if(p.indexOf(x)>=0){location.replace(b+"/"+x+(r==="/"?${JSON.stringify(home)}:r)+location.search+location.hash);return}}}catch(e){}})();`;
}
