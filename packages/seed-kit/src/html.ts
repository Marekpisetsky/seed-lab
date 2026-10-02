/**
 * HTML written as template strings, escaped by default: a value is text
 * unless it is already HTML (made by `html` or `raw`), so a word in a
 * dictionary can never become markup by accident.
 */

export class Html {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

export function raw(value: string): Html {
  return new Html(value);
}

const ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escape(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

function part(value: unknown): string {
  if (value instanceof Html) return value.value;
  if (Array.isArray(value)) return value.map(part).join("");
  if (value === null || value === undefined || value === false) return "";
  return escape(String(value));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  return new Html(strings.reduce((out, text, index) => out + text + (index < values.length ? part(values[index]) : ""), ""));
}

/**
 * A dictionary sentence with "**bold**" parts and "[words](address)"
 * links, escaped first. Addresses of the site ("/principles/") come in
 * already localized by the caller. When the caller answers with HTML
 * instead of an address, that HTML replaces the whole link.
 */
export function rich(text: string, link: (href: string) => string | Html = (href) => href): Html {
  return raw(
    escape(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, words: string, href: string) => {
        const target = link(href);
        return target instanceof Html ? target.value : `<a href="${escape(target)}">${words}</a>`;
      }),
  );
}
