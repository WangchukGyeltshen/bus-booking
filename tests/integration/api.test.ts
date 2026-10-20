import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { createApp } from "../../src/app";
import { BookingService } from "../../src/bookingService";

const NOW = new Date(2026, 9, 20, 15, 0); // fixed "now": 20 Oct 2026, 3:00 PM
const ROUTE = "Phuntsholing-Thimphu";
const TRIP = "2026-10-30"; // 10 days ahead

// Quality Improvement 2: a fresh app with its own empty service for every test
let app: Hono;
beforeEach(() => {
  app = createApp(new BookingService(() => NOW));
});

/** Sends a POST request with a JSON body. */
function post(path: string, body: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = (seat: number) => ({
  name: "Wangchuk", phone: "77123456", route: ROUTE, date: TRIP,
  passengers: [{ seat, age: 30 }],
});

describe("API integration (app.ts + service + validation)", () => {
  it("TC-26: GET /api/routes returns routes and fares", async () => {
    const res = await app.request("/api/routes");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.routes).toContain(ROUTE);
    expect(data.adultFare).toBe(300);
  });

  it("TC-27: POST booking returns 201, then booking and seats can be fetched", async () => {
    const res = await post("/api/bookings", valid(7));
    expect(res.status).toBe(201);
    const booking = await res.json();

    const get = await app.request(`/api/bookings/${booking.id}`);
    expect(get.status).toBe(200);
    expect((await get.json()).name).toBe("Wangchuk");

    const seats = await app.request(`/api/seats?route=${ROUTE}&date=${TRIP}`);
    expect((await seats.json()).booked).toEqual([7]);
  });

  it("TC-28: double booking through the API returns 409", async () => {
    await post("/api/bookings", valid(8));
    const res = await post("/api/bookings", valid(8));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already booked/);
  });

  it("TC-29: invalid input and invalid JSON return 400", async () => {
    const bad = await post("/api/bookings", { ...valid(1), phone: "123" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error).toMatch(/Phone/);

    const notJson = await app.request("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(notJson.status).toBe(400);
  });

  it("TC-30: unknown booking returns 404 for lookup and cancel", async () => {
    expect((await app.request("/api/bookings/BK-9999")).status).toBe(404);
    expect((await post("/api/bookings/BK-9999/cancel", {})).status).toBe(404);
  });

  it("TC-31: cancel returns 90% refund, second cancel returns 409", async () => {
    const created = await (await post("/api/bookings", valid(9))).json();
    const res = await post(`/api/bookings/${created.id}/cancel`, {});
    expect(res.status).toBe(200);
    const cancelled = await res.json();
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.refund).toBe(270);
    expect((await post(`/api/bookings/${created.id}/cancel`, {})).status).toBe(409);
  });

  it("TC-32: seat query with an invalid route returns 400", async () => {
    const res = await app.request(`/api/seats?route=Paro-Thimphu&date=${TRIP}`);
    expect(res.status).toBe(400);
  });

  it("TC-35 (DEF-01): null body returns 400, not 500", async () => {
    const res = await post("/api/bookings", null);
    expect(res.status).toBe(400);
  });

  it("TC-36 (DEF-02): wrong field types return 400, not 500", async () => {
    const base = valid(1);
    expect((await post("/api/bookings", { ...base, name: 123 })).status).toBe(400);
    expect((await post("/api/bookings", { ...base, passengers: "abc" })).status).toBe(400);
    expect((await post("/api/bookings", { ...base, passengers: [null] })).status).toBe(400);
  });

  it("TC-37 (DEF-04): unknown API path returns a JSON 404", async () => {
    const res = await post("/api/bookings//cancel", {});
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBeDefined();
  });
});
