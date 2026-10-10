import { ImageResponse } from "next/og";
import { CHROME_WORDS } from "@seed-kit/chrome.ts";
import { getI18n } from "@/i18n";

/** Colours of tokens.css: a dark band with the seed green (an image cannot read CSS variables; a test keeps them equal). */
const COLORS = { background: "#0a0a0a", foreground: "#fafafa", muted: "#a3a3a3", brand: "#00a36c" };

/**
 * /og.png: the picture a shared link shows, drawn once at build time (a
 * static route, so the export writes a real .png file). Both languages:
 * the same image serves every page (i18n/metadata.ts links it).
 */

export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

const EN = getI18n("en").m;
const ES = getI18n("es").m;

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: COLORS.background, color: COLORS.foreground }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* The Horalis seed, matching src/app/icon.svg. */}
          <svg width="120" height="120" viewBox="0 0 32 32">
            <g fill={COLORS.brand}>
              <ellipse cx="16" cy="23.5" rx="10" ry="6.5" />
              <rect x="14.7" y="11" width="2.6" height="8" rx="1.3" />
              <path d="M15.6 13.2C15 8.6 11.4 5.6 6.2 5.8c.4 5 4.2 8 9.4 7.4z" />
              <path d="M16.4 11.6c.8-4.8 4.6-7.8 9.6-7.4-.6 5-4.6 7.8-9.6 7.4z" />
            </g>
          </svg>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3 }}>{EN.site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 50, fontWeight: 700 }}>{EN.site.tagline}</div>
          <div style={{ fontSize: 40, color: COLORS.muted }}>{ES.site.tagline}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: COLORS.muted }}>
          <div style={{ display: "flex" }}>{EN.site.footerNote}</div>
          <div style={{ display: "flex", color: COLORS.brand, fontWeight: 700 }}>{CHROME_WORDS.en.hub}</div>
        </div>
      </div>
    ),
    size,
  );
}
