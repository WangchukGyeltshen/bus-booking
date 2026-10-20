   import { describe, it, expect } from "vitest";
   import {
     createBooking, cancelBooking, getBooking, getBookedSeats, BookingRequest,
   } from "../../src/bookingService";
   import { ConflictError, NotFoundError, ValidationError } from "../../src/errors";

   /** Returns a local date string (YYYY-MM-DD) offset from today. */
   function dateOffset(days: number): string {
     const d = new Date();
     d.setDate(d.getDate() + days);
     const mm = String(d.getMonth() + 1).padStart(2, "0");
     const dd = String(d.getDate()).padStart(2, "0");
     return `${d.getFullYear()}-${mm}-${dd}`;
   }

   /** Builds a valid request; tests override only what they need. */
   function request(overrides: Partial<BookingRequest> = {}): BookingRequest {
     return {
       name: "Wangchuk",
       phone: "17123456",
       route: "Phuntsholing-Thimphu",
       date: dateOffset(5),
       passengers: [{ seat: 1, age: 30 }],
       ...overrides,
     };
   }

   // WORKAROUND: the service uses one shared global list, so every test
   // must use its own date to avoid seat clashes with other tests.
   describe("Booking service (bookingService.ts)", () => {
     it("TC-20: valid booking is confirmed with the correct total fare", () => {
       const b = createBooking(request({
         date: dateOffset(5),
         passengers: [{ seat: 1, age: 30 }, { seat: 2, age: 8 }],
       }));
       expect(b.id).toMatch(/^BK-\d{4}$/);
       expect(b.status).toBe("CONFIRMED");
       expect(b.totalFare).toBe(450);
       expect(getBooking(b.id)).toEqual(b);
     });

     it("TC-21: booking an already-taken seat is rejected (double booking)", () => {
       const date = dateOffset(6);
       createBooking(request({ date, passengers: [{ seat: 10, age: 30 }] }));
       expect(getBookedSeats("Phuntsholing-Thimphu", date)).toEqual([10]);
       expect(() =>
         createBooking(request({ date, passengers: [{ seat: 10, age: 25 }] })),
       ).toThrow(ConflictError);
     });

     it("TC-22: same seat on another route or date is allowed", () => {
       const date = dateOffset(7);
       createBooking(request({ date, passengers: [{ seat: 3, age: 30 }] }));
       expect(() => createBooking(request({
         date, route: "Thimphu-Phuntsholing", passengers: [{ seat: 3, age: 30 }],
       }))).not.toThrow();
       expect(() => createBooking(request({
         date: dateOffset(8), passengers: [{ seat: 3, age: 30 }],
       }))).not.toThrow();
     });

     it("TC-23: cancelling 9+ days ahead refunds 90% and frees the seat", () => {
       const date = dateOffset(9);
       const b = createBooking(request({ date, passengers: [{ seat: 5, age: 30 }] }));
       const cancelled = cancelBooking(b.id);
       expect(cancelled.status).toBe("CANCELLED");
       expect(cancelled.refund).toBe(270);
       expect(getBookedSeats("Phuntsholing-Thimphu", date)).toEqual([]);
       expect(() =>
         createBooking(request({ date, passengers: [{ seat: 5, age: 40 }] })),
       ).not.toThrow();
     });

     it("TC-24: cancelling twice or an unknown booking is rejected", () => {
       const b = createBooking(request({ date: dateOffset(10) }));
       cancelBooking(b.id);
       expect(() => cancelBooking(b.id)).toThrow(ConflictError);
       expect(() => cancelBooking("BK-9999")).toThrow(NotFoundError);
     });

     it("TC-25: invalid request is rejected and nothing is saved", () => {
       const date = dateOffset(11);
       expect(() => createBooking(request({ date, phone: "12345" }))).toThrow(ValidationError);
       expect(getBookedSeats("Phuntsholing-Thimphu", date)).toEqual([]);
     });
   });