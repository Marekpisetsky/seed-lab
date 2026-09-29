import type { Metadata } from "next";
import { Moved } from "@/components/moved";

export const metadata: Metadata = { title: "My money", robots: { index: false } };

export default function FirePage() {
  return <Moved to="/" name="My money" />;
}
