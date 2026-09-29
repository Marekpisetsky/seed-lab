import type { Metadata } from "next";
import { Moved } from "@/components/moved";

export const metadata: Metadata = { title: "My stocks", robots: { index: false } };

export default function ChartsPage() {
  return <Moved to="/stocks" name="My stocks" />;
}
