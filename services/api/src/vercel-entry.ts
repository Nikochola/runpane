// Bundled by build.mjs into api/index.js — Vercel function entry.
//
// Vercel's Node.js runtime calls handlers as `(req, res)` and pre-parses
// the request body (req.body), which means Hono's stream-based body
// reading hangs forever. We rebuild a proper Web Request from Vercel's
// req object and feed that to Hono's app.fetch.
import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./index.js";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  try {
    const host = req.headers.host ?? "localhost";
    const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
    const url = new URL(req.url ?? "/", `${proto}://${host}`);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) headers.set(k, v.join(", "));
      else if (typeof v === "string") headers.set(k, v);
    }

    const method = req.method ?? "GET";
    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD" && req.body !== undefined) {
      body =
        typeof req.body === "string"
          ? req.body
          : Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : JSON.stringify(req.body);
    }

    const webReq = new Request(url.toString(), { method, headers, body });
    const webRes = await app.fetch(webReq);

    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const buf = Buffer.from(await webRes.arrayBuffer());
    res.end(buf);
  } catch (err: any) {
    console.error("[runpane] handler error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: err?.message ?? String(err) }));
  }
}
