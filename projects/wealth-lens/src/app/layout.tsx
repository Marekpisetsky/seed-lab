import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { StorageNotice } from "@/components/storage-notice";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wealth Lens",
    template: "%s · Wealth Lens",
  },
  description:
    "A personal finance lens: real gains and time to goal, per-stock price charts, and how much capital it takes to live off investments in different countries.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Wealth Lens
            </Link>
            <MainNav />
          </div>
        </header>
        <StorageNotice />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-border">
          <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted">
            Not financial advice. No broker connection. Your data stays in this browser.
          </p>
        </footer>
      </body>
    </html>
  );
}
