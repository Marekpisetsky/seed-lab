import { createPriceProxy } from "@/lib/price-proxy";

/**
 * GET /api/prices?symbol=aapl.us → daily closes from Stooq, an unofficial
 * third-party source (see lib/price-proxy.ts for caching and error handling).
 */
export const GET = createPriceProxy();
