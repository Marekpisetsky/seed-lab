/**
 * A built site served from this machine, for every app's browser tests: a
 * folder on a free port, with the addresses a static host gives it
 * ("/es" → es.html, "/es/" → es/index.html). Nothing goes elsewhere.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
  ".txt": "text/plain",
  ".ico": "image/x-icon",
};

export async function serve(folder: string): Promise<{ base: string; close: () => void }> {
  const server = createServer((request, response) => {
    let file = join(folder, decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname));
    if (existsSync(`${file.replace(/\/$/, "")}.html`)) file = `${file.replace(/\/$/, "")}.html`;
    else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return void response.writeHead(404).end();
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  return { base: `http://localhost:${typeof address === "object" && address ? address.port : 0}`, close: () => server.close() };
}
