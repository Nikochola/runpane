// Bundled by build.mjs into api/index.js — the actual Vercel function entry.
// All imports are static so esbuild inlines them; the deployed function
// resolves nothing from node_modules at runtime.
//
// Vercel's Node.js runtime expects a Node-style (req, res) handler, not
// the Web API Request/Response one. @hono/node-server bridges the two.
import { getRequestListener } from "@hono/node-server";
import app from "./index.js";

export const config = { runtime: "nodejs" };
export default getRequestListener(app.fetch);
