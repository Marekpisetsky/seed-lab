/**
 * `npm start`: serves the static build (out/) the way the published site
 * does, inside Wealth Lens's folder (deploy/site.json, "/wealth-lens"):
 * http://localhost:3000/wealth-lens/. "/" goes there; a folder serves its
 * index.html; anything missing gets out/404.html. For the whole site with
 * the hub, see hub/README.md ("Ver el sitio completo en local").
 */

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../../../deploy/site.json" with { type: "json" };

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const BASE = site.wealthLensPath;
const PORT = Number(process.env.PORT ?? 3000);
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
};

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  if (path === "/" || path === BASE) {
    response.writeHead(302, { location: `${BASE}/` }).end();
    return;
  }
  let file = path.startsWith(`${BASE}/`) ? join(OUT, normalize(path.slice(BASE.length))) : "";
  if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  const found = file.startsWith(OUT) && existsSync(file) && statSync(file).isFile();
  const served = found ? file : join(OUT, "404.html");
  response.writeHead(found ? 200 : 404, { "content-type": TYPES[extname(served)] ?? "application/octet-stream" });
  createReadStream(served).pipe(response);
}).listen(PORT, () => console.log(`Wealth Lens: http://localhost:${PORT}${BASE}/`));
