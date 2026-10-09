/**
 * How to reach Horalis: seed-kit's address (packages/seed-kit/src/site.ts),
 * the one every app reads, so a change there reaches every tool.
 *
 * The email address is kept in two parts and only joined in the browser
 * (components/ui/email.tsx): the static HTML never holds it whole, nor a
 * mail link, so simple address harvesters do not find it.
 */
export { CONTACT } from "@seed-kit/site.ts";
