import { serve } from "@hono/node-server";
import { createApp } from "./app";

/** Port is configurable through the PORT environment variable. */
const port = Number(process.env.PORT ?? 3000);

/** The real app uses one shared booking service with the system clock. */
const app = createApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Bus booking server running at http://localhost:${info.port}`);
});
