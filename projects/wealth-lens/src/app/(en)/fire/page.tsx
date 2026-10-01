import type { Metadata } from "next";
import { Moved } from "@/components/moved";
import { Site } from "@/components/site/site";
import { EN } from "@/i18n";

export const metadata: Metadata = { title: EN.m.site.nav.money, robots: { index: false } };

export default function FirePage() {
  return (
    <Site>
      <Moved to="/" name={EN.m.site.nav.money} />
    </Site>
  );
}
