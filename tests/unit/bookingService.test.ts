import { describe, it, expect, beforeEach } from "vitest";
import { BookingService, BookingRequest } from "../../src/bookingService";
import { ConflictError, NotFoundError, ValidationError } from "../../src/errors";

/** Fixed "now": 20 Oct 2026, 3:00 PM. Tests can move it forward. */
let now: Date;
let service: BookingService;

const ROUTE = "Phuntsholing-Thimphu";
const TRIP = "2026-10-30"; // 10 days ahead of "now", departs 08:00

/** Builds a valid request; tests override only what they need. */
function request(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    name: "Wangchuk",
    phone: "17123456",
    route: ROUTE,
    date: TRIP,
    passengers: [{ seat: 1, age: 30 }],
    ...overrides,
  };
}

// Quality Improvement 2: every test gets a fresh, empty service with a fixed clock,
// so tests no longer need different dates to avoid clashing with each other.
beforeEach(() => {
  now = new Date(2026, 9, 20, 15, 0);
  service = new BookingService(() => now);
});

describe("Booking service (bookingService.ts)", () => {
  it("TC-20: valid booking is confirmed with the correct total fare", () => {
    const b = service.createBooking(request({
      passengers: [{ seat: 1, age: 30 }, { seat: 2, age: 8 }],
    }));
    expect(b.id).toBe("BK-0001"); // predictable now that each test starts empty
    expect(b.status).toBe("CONFIRMED");
    expect(b.totalFare).toBe(450);
    expect(service.getBooking(b.id)).toEqual(b);
  });

  it("TC-21: booking an already-taken seat is rejected (double booking)", () => {
    service.createBooking(request({ passengers: [{ seat: 10, age: 30 }] }));
    expect(service.getBookedSeats(ROUTE, TRIP)).toEqual([10]);
    expect(() =>
      service.createBooking(request({ passengers: [{ seat: 10, age: 25 }] })),
    ).toThrow(ConflictError);
  });

  it("TC-22: same seat on another route or date is allowed", () => {
    service.createBooking(request({ passengers: [{ seat: 3, age: 30 }] }));
    expect(() => service.createBooking(request({
      route: "Thimphu-Phuntsholing", passengers: [{ seat: 3, age: 30 }],
    }))).not.toThrow();
    expect(() => service.createBooking(request({
      date: "2026-10-31", passengers: [{ seat: 3, age: 30 }],
    }))).not.toThrow();
  });

  it("TC-23: cancelling 10 days ahead refunds 90% and frees the seat", () => {
    const b = service.createBooking(request({ passengers: [{ seat: 5, age: 30 }] }));
    const cancelled = service.cancelBooking(b.id);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.refund).toBe(270);
    expect(service.getBookedSeats(ROUTE, TRIP)).toEqual([]);
    expect(() =>
      service.createBooking(request({ passengers: [{ seat: 5, age: 40 }] })),
    ).not.toThrow();
  });

  it("TC-24: cancelling twice or an unknown booking is rejected", () => {
    const b = service.createBooking(request());
    service.cancelBooking(b.id);
    expect(() => service.cancelBooking(b.id)).toThrow(ConflictError);
    expect(() => service.cancelBooking("BK-9999")).toThrow(NotFoundError);
  });

  it("TC-25: invalid request is rejected and nothing is saved", () => {
    expect(() => service.createBooking(request({ phone: "12345" }))).toThrow(ValidationError);
    expect(service.getBookedSeats(ROUTE, TRIP)).toEqual([]);
  });

  it("TC-40 (QI-1): 50% and 0% refunds can be tested through the service", () => {
    const b1 = service.createBooking(request({ passengers: [{ seat: 20, age: 30 }] }));
    const b2 = service.createBooking(request({ passengers: [{ seat: 21, age: 30 }] }));
    now = new Date(2026, 9, 29, 20, 0); // exactly 12h before 30 Oct 08:00 -> 50%
    expect(service.cancelBooking(b1.id).refund).toBe(150);
    now = new Date(2026, 9, 30, 7, 0); // 1h before departure -> 0%
    expect(service.cancelBooking(b2.id).refund).toBe(0);
  });

  it("TC-41 (QI-2): two services do not share bookings", () => {
    const other = new BookingService(() => now);
    service.createBooking(request({ passengers: [{ seat: 7, age: 30 }] }));
    expect(other.getBookedSeats(ROUTE, TRIP)).toEqual([]);
    expect(() => other.createBooking(request({ passengers: [{ seat: 7, age: 30 }] }))).not.toThrow();
  });
});
