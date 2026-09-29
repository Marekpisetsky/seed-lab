import Link from "next/link";

/**
 * An old address that now lives elsewhere. A static site has no server
 * redirects, so the page sends the browser on (React puts the meta tag in
 * the head) and shows a link for the moment it takes.
 */
export function Moved({ to, name }: { to: string; name: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${to}`} />
      <p className="text-sm">
        This page is now{" "}
        <Link href={to} replace className="font-medium text-accent underline-offset-2 hover:underline">
          {name}
        </Link>
        .
      </p>
    </>
  );
}
