// Bundled by build.mjs into api/index.mjs — the actual Vercel function entry.
// All imports here are static so esbuild inlines them; the deployed function
// resolves nothing from node_modules at runtime.
import { handle } from "hono/vercel";
import app from "./index.js";

export const config = { runtime: "nodejs" };
export default handle(app);
