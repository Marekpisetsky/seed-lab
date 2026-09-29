"use client";

import dynamic from "next/dynamic";
import { ResultsLoading } from "@/components/results-loading";

/** Holdings, charts and the curated list are their own chunk, so the page shell stays small. */
export const StocksModule = dynamic(() => import("./stocks-content").then((module) => module.StocksContent), {
  ssr: false,
  loading: ResultsLoading,
});
