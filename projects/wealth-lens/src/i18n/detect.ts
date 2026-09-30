import { DEFAULT_LOCALE, PREFIXED_LOCALES } from "./locales";

/**
 * Runs in the <head> of every page, before anything is painted:
 *
 * - tells the document which language the page is in (the /es/ pages share
 *   the root layout, whose <html> is written once, in English);
 * - on arriving from outside the site at an English address, it sends the
 *   browser to the same page in the reader's language when the browser
 *   prefers one the app speaks (say, Spanish before English).
 *
 * Nothing is stored: a reload, going back, a link within the site or an
 * address in another language are left as they are, so a language picked
 * with EN/ES stays picked.
 */
export const LANGUAGE_SCRIPT = `(function(){var p=${JSON.stringify(PREFIXED_LOCALES)},d="${DEFAULT_LOCALE}",s=location.pathname.split("/")[1],c=p.indexOf(s)>=0?s:d;document.documentElement.lang=c;if(c!==d)return;try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type!=="navigate")return;if(document.referrer&&new URL(document.referrer).origin===location.origin)return;var l=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||""];for(var i=0;i<l.length;i++){var x=String(l[i]).slice(0,2).toLowerCase();if(x===d)return;if(p.indexOf(x)>=0){location.replace("/"+x+(location.pathname==="/"?"":location.pathname)+location.search+location.hash);return}}}catch(e){}})();`;
