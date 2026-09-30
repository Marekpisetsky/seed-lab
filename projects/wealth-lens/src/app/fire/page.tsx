import type { Metadata } from "next";
import { Moved } from "@/components/moved";
import { Site } from "@/components/site/site";

export const metadata: Metadata = { title: "My money", robots: { index: false } };

export default function FirePage() {
  return (
    <Site locale="en">
      <Moved to="/" name="My money" />
    </Site>
  );
}
