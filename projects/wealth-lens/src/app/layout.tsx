import type { Metadata } from "next";
import { LANGUAGE_SCRIPT, THEME_SCRIPT } from "@/i18n/detect";
import { SITE_URL } from "@/i18n/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Horalis Growth", template: "%s · Horalis Growth" },
};

/**
 * One root for every language, so moving between /… and /es/… stays inside
 * the page and keeps the plan in memory. The inline scripts set the tab's
 * light or dark mode and the document's language before anything is
 * painted (i18n/detect.ts).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANGUAGE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
