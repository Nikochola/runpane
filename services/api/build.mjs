// Bundle the Vercel entry into a single ESM file with everything inlined,
// so the serverless runtime never has to resolve workspace TS or any other
// packages from node_modules.
import * as esbuild from "esbuild";
import fs from "node:fs";

await esbuild.build({
  entryPoints: ["src/vercel-entry.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "api/index.mjs",
  banner: {
    js: "import { createRequire as __createRequire } from 'module';\nconst require = __createRequire(import.meta.url);",
  },
  logLevel: "info",
});

// Make sure no stale TypeScript entry confuses Vercel's function discovery.
for (const f of ["api/index.ts", "api/_app.mjs"]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
