import { serve } from "@hono/node-server";
import { app } from "./app";

/** Port is configurable through the PORT environment variable. */
const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Bus booking server running at http://localhost:${info.port}`);
});