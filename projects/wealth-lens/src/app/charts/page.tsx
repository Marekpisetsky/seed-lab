import type { Metadata } from "next";
import { Moved } from "@/components/moved";
import { Site } from "@/components/site/site";
import { EN } from "@/i18n";

export const metadata: Metadata = { title: EN.m.site.nav.stocks, robots: { index: false } };

export default function ChartsPage() {
  return (
    <Site locale="en">
      <Moved to="/stocks" name={EN.m.site.nav.stocks} />
    </Site>
  );
}
