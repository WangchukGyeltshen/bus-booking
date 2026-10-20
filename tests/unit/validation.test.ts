import { describe, it, expect } from "vitest";
import {
  validateName, validatePhone, validateRoute,
  validateSeats, validateTravelDate,
} from "../../src/validation";
import { ValidationError } from "../../src/errors";

/** Fixed "now" for date tests: 20 Oct 2026, 3:00 PM (no dependence on the real clock). */
const NOW = new Date(2026, 9, 20, 15, 0);

describe("Input validation (validation.ts)", () => {
  it("TC-07: valid name (trimmed) and phone are accepted", () => {
    expect(validateName("  Wangchuk  ")).toBe("Wangchuk");
    expect(validatePhone("17123456")).toBe("17123456");
    expect(validatePhone("77123456")).toBe("77123456");
  });

  it("TC-08: boundary, name of 2 and 50 chars accepted, 1 and 51 rejected", () => {
    expect(validateName("Ab")).toBe("Ab");
    expect(validateName("a".repeat(50))).toHaveLength(50);
    expect(() => validateName("A")).toThrow(ValidationError);
    expect(() => validateName("a".repeat(51))).toThrow(ValidationError);
  });

  it("TC-09: invalid phones are rejected", () => {
    expect(() => validatePhone("1712345")).toThrow(ValidationError);   // 7 digits
    expect(() => validatePhone("171234567")).toThrow(ValidationError); // 9 digits
    expect(() => validatePhone("27123456")).toThrow(ValidationError);  // wrong prefix
    expect(() => validatePhone("7712345a")).toThrow(ValidationError);  // letter
  });

  it("TC-10: unsupported route is rejected", () => {
    expect(validateRoute("Phuntsholing-Thimphu")).toBe("Phuntsholing-Thimphu");
    expect(() => validateRoute("Paro-Thimphu")).toThrow(ValidationError);
  });

  it("TC-11: boundary, 1 and 4 seats accepted, 0 and 5 rejected", () => {
    expect(validateSeats([1])).toEqual([1]);
    expect(validateSeats([1, 2, 3, 4])).toHaveLength(4);
    expect(() => validateSeats([])).toThrow(ValidationError);
    expect(() => validateSeats([1, 2, 3, 4, 5])).toThrow(ValidationError);
  });

  it("TC-12: boundary, seats 1 and 30 accepted, 0 and 31 rejected", () => {
    expect(validateSeats([1, 30])).toEqual([1, 30]);
    expect(() => validateSeats([0])).toThrow(ValidationError);
    expect(() => validateSeats([31])).toThrow(ValidationError);
  });

  it("TC-13: same seat twice in one booking is rejected", () => {
    expect(() => validateSeats([5, 5])).toThrow(ValidationError);
  });

  it("TC-14: boundary, today and +30 days accepted, yesterday and +31 rejected", () => {
    expect(validateTravelDate("2026-10-20", NOW)).toBe("2026-10-20");             // today
    expect(validateTravelDate("2026-11-19", NOW)).toBe("2026-11-19");             // +30 days
    expect(() => validateTravelDate("2026-10-19", NOW)).toThrow(ValidationError); // yesterday
    expect(() => validateTravelDate("2026-11-20", NOW)).toThrow(ValidationError); // +31 days
  });

  it("TC-15: wrong format and non-existent dates are rejected", () => {
    expect(() => validateTravelDate("20-10-2026")).toThrow(ValidationError);
    expect(() => validateTravelDate("2026-02-30")).toThrow(ValidationError);
  });
});