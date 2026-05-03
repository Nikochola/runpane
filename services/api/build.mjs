// Bundle the API into a single ESM file so Vercel doesn't need to resolve
// workspace TypeScript packages from node_modules at runtime.
import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "api/_app.mjs",
  // Inline everything (workspace packages + npm deps) so the runtime needs
  // nothing from node_modules. postgres ships pure JS, hono is pure JS.
  banner: {
    js: "import { createRequire as __createRequire } from 'module';\nconst require = __createRequire(import.meta.url);",
  },
  logLevel: "info",
});
