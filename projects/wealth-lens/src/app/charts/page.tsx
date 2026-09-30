import type { Metadata } from "next";
import { Moved } from "@/components/moved";
import { Site } from "@/components/site/site";

export const metadata: Metadata = { title: "My stocks", robots: { index: false } };

export default function ChartsPage() {
  return (
    <Site locale="en">
      <Moved to="/stocks" name="My stocks" />
    </Site>
  );
}
