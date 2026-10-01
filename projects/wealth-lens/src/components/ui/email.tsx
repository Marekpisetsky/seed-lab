"use client";

import { useSyncExternalStore } from "react";
import { CONTACT } from "@/lib/site";

const subscribe = () => () => {};

/**
 * seed-lab's email address. The server-rendered HTML holds only its two
 * parts, in data attributes that CSS shows as one address (globals.css,
 * .email-parts), so it reads even without JavaScript. In the browser it
 * becomes a normal mail link.
 */
export function Email({ className }: { className?: string }) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!inBrowser) return <span className="email-parts" data-user={CONTACT.user} data-domain={CONTACT.domain} />;
  const address = `${CONTACT.user}@${CONTACT.domain}`;
  return (
    <a href={`mailto:${address}`} className={className}>
      {address}
    </a>
  );
}
