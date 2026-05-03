// Bundle the Vercel entry into a single CommonJS file. Vercel's Node
// serverless runtime resolves CJS most reliably, and bundling means the
// runtime never has to find anything in node_modules at runtime.
import * as esbuild from "esbuild";
import fs from "node:fs";

await esbuild.build({
  entryPoints: ["src/vercel-entry.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: "api/index.js",
  logLevel: "info",
});

// Clear any older build artifacts so Vercel only sees one entry.
for (const f of ["api/index.ts", "api/index.mjs", "api/_app.mjs"]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
