import { ImageResponse } from "next/og";
import { getI18n } from "@/i18n";

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
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f8fafc", color: "#0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#1d4ed8" />
            <circle cx="28" cy="28" r="16" fill="none" stroke="#fff" strokeWidth="5" />
            <path d="M40 40 L53 53" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
            <path d="M19 34 L25 27 L30 31 L37 22" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>{EN.site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 50, fontWeight: 600 }}>{EN.site.tagline}</div>
          <div style={{ fontSize: 40, color: "#475569" }}>{ES.site.tagline}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#475569" }}>
          <div style={{ display: "flex" }}>{EN.site.footerNote}</div>
          <div style={{ display: "flex", color: "#1d4ed8", fontWeight: 600 }}>{EN.site.seedLab}</div>
        </div>
      </div>
    ),
    size,
  );
}
