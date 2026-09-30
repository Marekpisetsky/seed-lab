"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n";

/**
 * An old address that now lives elsewhere. A static site has no server
 * redirects, so the page sends the browser on (React puts the meta tag in
 * the head) and shows a link for the moment it takes.
 */
export function Moved({ to, name }: { to: string; name: string }) {
  const { m } = useI18n();
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${to}`} />
      <p className="text-sm">
        {m.data.moved}{" "}
        <Link href={to} replace className="font-medium text-accent underline-offset-2 hover:underline">
          {name}
        </Link>
        .
      </p>
    </>
  );
}
