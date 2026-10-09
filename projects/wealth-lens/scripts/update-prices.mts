/**
 * Retired (Horalis, 9 October 2026): Horalis no longer downloads daily
 * prices. Nothing on the site depends on daily closes any more: every
 * chart uses the closed historical series in src/data/.
 *
 * The workflow .github/workflows/update-prices.yml still calls this file
 * every day; the session that retired it could not delete workflows.
 * Delete that workflow, then this file.
 */
console.log("Daily prices are retired: nothing to do. Delete .github/workflows/update-prices.yml.");
