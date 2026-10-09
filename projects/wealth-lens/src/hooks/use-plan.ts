"use client";

import { useState } from "react";
import { startOfUtcDay } from "@/lib/dates";

/** Today at 00:00 UTC, fixed for the life of the component. */
export function useToday(): Date {
  const [today] = useState(() => startOfUtcDay(new Date()));
  return today;
}
