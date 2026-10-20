import { describe, it, expect } from "vitest";
import {
  validateName, validatePhone, validateRoute,
  validateSeats, validateTravelDate,
} from "../../src/validation";
import { ValidationError } from "../../src/errors";

/** Returns a local date string (YYYY-MM-DD) offset from today. */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

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
    expect(validateTravelDate(dateOffset(0))).toBe(dateOffset(0));
    expect(validateTravelDate(dateOffset(30))).toBe(dateOffset(30));
    expect(() => validateTravelDate(dateOffset(-1))).toThrow(ValidationError);
    expect(() => validateTravelDate(dateOffset(31))).toThrow(ValidationError);
  });

  it("TC-15: wrong format and non-existent dates are rejected", () => {
    expect(() => validateTravelDate("20-10-2026")).toThrow(ValidationError);
    expect(() => validateTravelDate("2026-02-30")).toThrow(ValidationError);
  });
});