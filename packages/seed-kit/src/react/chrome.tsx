/**
 * The header and footer for React apps (Wealth Lens): the same model,
 * markup and classes as chrome-html.ts, styled by chrome.css. Links inside
 * the app go through the app's own link component (`Link`), so moving
 * between pages and languages stays in the page; addresses of other sites
 * are plain links. The theme menu and the launcher close on Escape (the
 * focus goes back to their button), on a press outside them, when the
 * other one opens and when a tool is chosen. The theme follows theme.ts:
 * every copy of the menu shows the mode on <html data-theme>.
 *
 * Only React itself is imported: the app brings it, so the kit stays
 * without dependencies.
 */

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode, type SyntheticEvent } from "react";
import type { ChromeLink, ChromeWords, FooterModel, HeaderModel } from "../chrome.ts";
import { brandSvg, CHECK_ICON, GRID_ICON, THEME_ICONS } from "../icons.ts";
import { applyTheme, currentTheme, subscribeTheme, THEMES, type Theme } from "../theme.ts";

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

/** A <details> menu of the header: one open at a time, closed by Escape (back to its button) or a press outside. */
function useMenu(name: string, openMenu: string | null, setOpenMenu: (name: string | null) => void) {
  const open = openMenu === name;
  const root = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenMenu(null);
      summary.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, setOpenMenu]);
  return {
    root,
    summary,
    open,
    onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => {
      const nowOpen = event.currentTarget.open;
      if (nowOpen !== open) setOpenMenu(nowOpen ? name : null);
    },
    close: () => setOpenMenu(null),
  };
}

/** The three modes as radio buttons; `name` keeps each copy its own group. */
function ThemeChoices({ words, theme }: { words: ChromeWords; theme: Theme }) {
  const name = useId();
  return (
    <>
      <fieldset className="sk-themes">
        <legend className="sk-panel-title">{words.theme}</legend>
        {THEMES.map((mode) => (
          <label key={mode}>
            <input type="radio" name={name} value={mode} data-sk-theme="" checked={theme === mode} onChange={() => applyTheme(mode)} />
            <Icon svg={THEME_ICONS[mode]} />
            <span className="sk-mode">
              {words.themes[mode]}
              {mode === "auto" && <small>{words.themeAuto}</small>}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="sk-theme-note">{words.themeNote}</p>
    </>
  );
}

function ThemeMenu({ words, theme, menu }: { words: ChromeWords; theme: Theme; menu: ReturnType<typeof useMenu> }) {
  const id = useId();
  return (
    <details ref={menu.root} className="sk-theme" open={menu.open} onToggle={menu.onToggle}>
      <summary ref={menu.summary} aria-label={words.theme} title={words.theme} aria-controls={id}>
        {THEMES.map((mode) => (
          <span key={mode} className={`sk-icon sk-mode-${mode}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: THEME_ICONS[mode] }} />
        ))}
      </summary>
      <div className="sk-panel" id={id}>
        <ThemeChoices words={words} theme={theme} />
      </div>
    </details>
  );
}

function Launcher({ model, Link, theme, menu }: { model: HeaderModel; Link: LinkComponent; theme: Theme; menu: ReturnType<typeof useMenu> }) {
  const { words } = model;
  const id = useId();
  return (
    <details ref={menu.root} className="sk-launcher" open={menu.open} onToggle={menu.onToggle}>
      <summary ref={menu.summary} aria-label={words.launcher} title={words.launcher} aria-controls={id}>
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
              <To Link={Link} href={tool.href} aria-current={tool.current ? "true" : undefined} onClick={menu.close}>
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
        {/* On a narrow phone, where the theme menu has no room beside EN/ES (chrome.css). */}
        <div className="sk-panel-theme">
          <ThemeChoices words={words} theme={theme} />
        </div>
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
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => "auto" as const);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const themeMenu = useMenu("theme", openMenu, setOpenMenu);
  const launcher = useMenu("launcher", openMenu, setOpenMenu);
  return (
    <>
      <a className="sk-skip" href="#main">
        {words.skip}
      </a>
      <header className={`sk-header${model.theme ? ` theme-${model.theme}` : ""}`}>
        <div className="sk-wrap sk-bar">
          <To Link={Link} className="sk-brand" href={model.home.href} aria-current={model.home.current ? "page" : undefined}>
            <span className="sk-seed" dangerouslySetInnerHTML={{ __html: brandSvg(model.mark) }} />
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
            <ThemeMenu words={words} theme={theme} menu={themeMenu} />
            <Launcher model={model} Link={Link} theme={theme} menu={launcher} />
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
