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

  it("TC-40 (QI-1): 50% and 0% refunds can now be tested through the service", () => {
    const NOW = new Date(2026, 9, 20, 15, 0); // 20 Oct 2026, 3:00 PM
    // Departs 25 Oct 08:00; cancelling 24 Oct 20:00 leaves exactly 12h -> 50%
    const b1 = createBooking(request({ date: "2026-10-25", passengers: [{ seat: 20, age: 30 }] }), NOW);
    expect(cancelBooking(b1.id, new Date(2026, 9, 24, 20, 0)).refund).toBe(150);
    // Departs 26 Oct 08:00; cancelling 26 Oct 07:00 leaves 1h -> 0%
    const b2 = createBooking(request({ date: "2026-10-26", passengers: [{ seat: 21, age: 30 }] }), NOW);
    expect(cancelBooking(b2.id, new Date(2026, 9, 26, 7, 0)).refund).toBe(0);
  });
});
