export const config = { runtime: "nodejs" };

// Dynamic imports so ANY module-load error surfaces as JSON
// instead of the opaque FUNCTION_INVOCATION_FAILED crash
export default async function handler(req: Request): Promise<Response> {
  try {
    const [{ handle }, { default: app }] = await Promise.all([
      import("hono/vercel"),
      import("../src/index.js"),
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
