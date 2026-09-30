import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { FooterDataControls } from "@/components/data-controls";
import { LegacyDataNotice } from "@/components/legacy-data-notice";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wealth Lens",
    template: "%s · Wealth Lens",
  },
  description:
    "What your money pays today, when it is enough, and what it means in everyday life: where you could live off it and what it buys.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:font-medium"
        >
          Skip to content
        </a>
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex min-h-11 items-center self-start text-lg font-semibold tracking-tight">
              Wealth Lens
            </Link>
            <MainNav />
          </div>
        </header>
        <LegacyDataNotice />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:py-8">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-4">
            <FooterDataControls />
            <p className="text-xs text-muted">
              Nothing is stored or sent. Your data stays on your screen. Not financial advice.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
