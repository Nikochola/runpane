import { serve } from "@hono/node-server";
import { config } from "./config.js";
import app from "./index.js";

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`runpane API listening on http://localhost:${info.port}`);
});
