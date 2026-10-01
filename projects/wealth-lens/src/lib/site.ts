/**
 * How to reach seed-lab. One place, so another session can change it
 * without touching components.
 *
 * The email address is kept in two parts and only joined in the browser
 * (components/ui/email.tsx): the static HTML never holds it whole, nor a
 * mail link, so simple address harvesters do not find it.
 */
export const CONTACT = { user: "seedlab.eu", domain: "proton.me" } as const;
