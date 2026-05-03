// Vercel serverless entry. The actual app is pre-bundled into ./_app.mjs by
// the vercel-build step (services/api/build.mjs) — that's the only way to
// avoid Vercel's serverless runtime trying to resolve workspace .ts files
// from node_modules at runtime.
export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  try {
    const [{ handle }, { default: app }] = await Promise.all([
      import("hono/vercel"),
      import("./_app.mjs" as any),
    ]);
    return await handle(app)(req);
  } catch (err: any) {
    const message = err?.message ?? String(err);
    const stack = err?.stack ?? "";
    console.error("[runpane] Fatal load error:", err);
    return new Response(JSON.stringify({ error: message, stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
