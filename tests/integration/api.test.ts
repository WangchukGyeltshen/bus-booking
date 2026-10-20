   import { describe, it, expect } from "vitest";
   import { app } from "../../src/app";

   /** Returns a local date string (YYYY-MM-DD) offset from today. */
   function dateOffset(days: number): string {
     const d = new Date();
     d.setDate(d.getDate() + days);
     const mm = String(d.getMonth() + 1).padStart(2, "0");
     const dd = String(d.getDate()).padStart(2, "0");
     return `${d.getFullYear()}-${mm}-${dd}`;
   }

   /** Sends a POST request with a JSON body. */
   function post(path: string, body: unknown) {
     return app.request(path, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(body),
     });
   }

   const ROUTE = "Phuntsholing-Thimphu";
   const valid = (date: string, seat: number) => ({
     name: "Wangchuk", phone: "77123456", route: ROUTE, date,
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
       const date = dateOffset(12);
       const res = await post("/api/bookings", valid(date, 7));
       expect(res.status).toBe(201);
       const booking = await res.json();

       const get = await app.request(`/api/bookings/${booking.id}`);
       expect(get.status).toBe(200);
       expect((await get.json()).name).toBe("Wangchuk");

       const seats = await app.request(`/api/seats?route=${ROUTE}&date=${date}`);
       expect((await seats.json()).booked).toEqual([7]);
     });

     it("TC-28: double booking through the API returns 409", async () => {
       const date = dateOffset(13);
       await post("/api/bookings", valid(date, 8));
       const res = await post("/api/bookings", valid(date, 8));
       expect(res.status).toBe(409);
       expect((await res.json()).error).toMatch(/already booked/);
     });

     it("TC-29: invalid input and invalid JSON return 400", async () => {
       const bad = await post("/api/bookings", { ...valid(dateOffset(14), 1), phone: "123" });
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
       const created = await (await post("/api/bookings", valid(dateOffset(15), 9))).json();
       const res = await post(`/api/bookings/${created.id}/cancel`, {});
       expect(res.status).toBe(200);
       const cancelled = await res.json();
       expect(cancelled.status).toBe("CANCELLED");
       expect(cancelled.refund).toBe(270);
       expect((await post(`/api/bookings/${created.id}/cancel`, {})).status).toBe(409);
     });

     it("TC-32: seat query with an invalid route returns 400", async () => {
       const res = await app.request(`/api/seats?route=Paro-Thimphu&date=${dateOffset(5)}`);
       expect(res.status).toBe(400);
     });
   });