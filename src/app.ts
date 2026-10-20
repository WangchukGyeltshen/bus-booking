import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  ROUTES, TOTAL_SEATS, ADULT_FARE, CHILD_AGE_LIMIT, CHILD_DISCOUNT, DEPARTURE_HOUR,
} from "./config";
import { ValidationError, ConflictError, NotFoundError } from "./errors";
import { validateRoute, validateTravelDate } from "./validation";
import {
  createBooking, getBooking, cancelBooking, getBookedSeats, BookingRequest,
} from "./bookingService";

/** The HTTP application. Exported without starting a server so tests can use it. */
export const app = new Hono();

/** Route list and fare information for the booking form. */
app.get("/api/routes", (c) =>
  c.json({
    routes: ROUTES,
    totalSeats: TOTAL_SEATS,
    adultFare: ADULT_FARE,
    childFare: ADULT_FARE * (1 - CHILD_DISCOUNT),
    childAgeLimit: CHILD_AGE_LIMIT,
    departure: `${String(DEPARTURE_HOUR).padStart(2, "0")}:00`,
  }),
);

/** Booked seats for a route and date, e.g. /api/seats?route=...&date=2026-11-10 */
app.get("/api/seats", (c) => {
  const route = validateRoute(c.req.query("route") ?? "");
  const date = validateTravelDate(c.req.query("date") ?? "");
  return c.json({ route, date, totalSeats: TOTAL_SEATS, booked: getBookedSeats(route, date) });
});

/** Create a booking. Returns 201 with the booking. */
app.post("/api/bookings", async (c) => {
  let body: BookingRequest;
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  return c.json(createBooking(body), 201);
});

/** Look up a booking by ID. */
app.get("/api/bookings/:id", (c) => c.json(getBooking(c.req.param("id"))));

/** Cancel a booking and return it with the refund. */
app.post("/api/bookings/:id/cancel", (c) => c.json(cancelBooking(c.req.param("id"))));

/** Serve the web page (index.html, script, styles) from src/public. */
app.use("/*", serveStatic({ root: "./src/public" }));

/** Fix DEF-04: unknown paths return JSON (not plain text) so the page can read the error. */
app.notFound((c) => c.json({ error: "Not found" }, 404));

/** Maps business errors to HTTP status codes. */
app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400);
  if (err instanceof ConflictError) return c.json({ error: err.message }, 409);
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});