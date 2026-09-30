import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { LANGUAGE_SCRIPT } from "@/i18n/detect";
import { SITE_URL } from "@/i18n/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Wealth Lens", template: "%s · Wealth Lens" },
};

/**
 * One root for every language, so moving between /… and /es/… stays inside
 * the page and keeps the plan in memory. The inline script sets the
 * document's language before anything is painted (i18n/detect.ts).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANGUAGE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
