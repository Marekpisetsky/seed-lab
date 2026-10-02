/**
 * The header and footer for React apps (Wealth Lens): the same model,
 * markup and classes as chrome-html.ts, styled by chrome.css. Links inside
 * the app go through the app's own link component (`Link`), so moving
 * between pages and languages stays in the page; addresses of other sites
 * are plain links. The launcher closes on Escape (the focus goes back to
 * its button), on a press outside it and when a tool is chosen.
 *
 * Only React itself is imported: the app brings it, so the kit stays
 * without dependencies.
 */

import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { ChromeLink, FooterModel, HeaderModel } from "../chrome.ts";
import { CHECK_ICON, GRID_ICON, seedSvg } from "../icons.ts";

export interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  title?: string;
  hrefLang?: string;
  lang?: string;
  onClick?: () => void;
  "aria-current"?: "page" | "true";
  "aria-label"?: string;
}

/** A link of the app: Next's Link, or any component taking an href. */
export type LinkComponent = ComponentType<LinkProps>;

function PlainLink({ children, ...props }: LinkProps) {
  return <a {...props}>{children}</a>;
}

/** Inside the app ("/…"): the app's link; another site: a plain one. */
function To({ Link, ...props }: LinkProps & { Link: LinkComponent }) {
  const Component = props.href.startsWith("/") ? Link : PlainLink;
  return <Component {...props} />;
}

function Icon({ svg }: { svg: string }) {
  return <span className="sk-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Launcher({ model, Link }: { model: HeaderModel; Link: LinkComponent }) {
  const { words } = model;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      summary.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <details ref={root} className="sk-launcher" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary ref={summary} aria-label={words.launcher} title={words.launcher} aria-controls={id}>
        <Icon svg={GRID_ICON} />
      </summary>
      <div className="sk-panel" id={id}>
        <To Link={Link} className="sk-hub" href={model.hubHref}>
          <strong>{words.hub}</strong>
          <span>{words.hubNote}</span>
        </To>
        <p className="sk-panel-title">{words.tools}</p>
        <ul>
          {model.tools.map((tool) => (
            <li key={tool.id}>
              <To Link={Link} href={tool.href} aria-current={tool.current ? "true" : undefined} onClick={() => setOpen(false)}>
                <span className="sk-tool">{tool.name}</span>
                {tool.current && (
                  <span className="sk-here">
                    <Icon svg={CHECK_ICON} />
                    {words.here}
                  </span>
                )}
              </To>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function NavList({ links, Link }: { links: ChromeLink[]; Link: LinkComponent }) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <To Link={Link} href={link.href} aria-current={link.current ? "page" : undefined}>
            {link.label}
          </To>
        </li>
      ))}
    </ul>
  );
}

/** The skip link and the header. */
export function SiteHeader({ model, Link = PlainLink }: { model: HeaderModel; Link?: LinkComponent }) {
  const { words } = model;
  return (
    <>
      <a className="sk-skip" href="#main">
        {words.skip}
      </a>
      <header className={`sk-header${model.theme ? ` theme-${model.theme}` : ""}`}>
        <div className="sk-wrap sk-bar">
          <To Link={Link} className="sk-brand" href={model.home.href} aria-current={model.home.current ? "page" : undefined}>
            <span className="sk-seed" dangerouslySetInnerHTML={{ __html: seedSvg() }} />
            <span>{model.home.label}</span>
          </To>
          {model.nav.length > 0 && (
            <nav className="sk-nav" aria-label={words.pages}>
              <NavList links={model.nav} Link={Link} />
            </nav>
          )}
          <div className="sk-actions">
            <nav className="sk-langs" aria-label={words.language}>
              <ul>
                {model.languages.map((link) => (
                  <li key={link.locale}>
                    <To
                      Link={Link}
                      href={link.href}
                      hrefLang={link.locale}
                      lang={link.locale}
                      title={link.name}
                      aria-label={link.name}
                      aria-current={link.current ? "true" : undefined}
                    >
                      {link.label}
                    </To>
                  </li>
                ))}
              </ul>
            </nav>
            <Launcher model={model} Link={Link} />
          </div>
        </div>
      </header>
    </>
  );
}

/** The footer; `children` go first, inside it (an app's own controls). */
export function SiteFooter({ model, Link = PlainLink, children }: { model: FooterModel; Link?: LinkComponent; children?: ReactNode }) {
  const { words } = model;
  const links = model.partOf ? [...model.links, { label: words.partOf, href: model.partOf }] : model.links;
  return (
    <footer className={`sk-footer${model.theme ? ` theme-${model.theme}` : ""}`}>
      <div className="sk-wrap">
        {children}
        <nav aria-label={words.more}>
          <ul className="sk-links">
            {links.map((link) => (
              <li key={link.href}>
                <To Link={Link} href={link.href} aria-current={link.current ? "page" : undefined}>
                  {link.label}
                </To>
              </li>
            ))}
          </ul>
        </nav>
        {model.notes.map((note) => (
          <p key={note} className="sk-note">
            {note}
          </p>
        ))}
        <p className="sk-note">{words.copyright}</p>
      </div>
    </footer>
  );
}
