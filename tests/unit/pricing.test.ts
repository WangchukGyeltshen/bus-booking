import { describe, it, expect } from "vitest";
import { fareForAge, totalFare } from "../../src/pricing";
import { ValidationError } from "../../src/errors";

describe("Fare calculation (pricing.ts)", () => {
  it("TC-01: adult (age 30) pays full fare of Nu. 300", () => {
    expect(fareForAge(30)).toBe(300);
  });

  it("TC-02: child (age 5) pays half fare of Nu. 150", () => {
    expect(fareForAge(5)).toBe(150);
  });

  it("TC-03: boundary, age 11 is a child and age 12 is an adult", () => {
    expect(fareForAge(11)).toBe(150);
    expect(fareForAge(12)).toBe(300);
  });

  it("TC-04: boundary, ages 0 and 120 are accepted", () => {
    expect(fareForAge(0)).toBe(150);
    expect(fareForAge(120)).toBe(300);
  });

  it("TC-05: invalid ages (-1, 121, 5.5) are rejected", () => {
    expect(() => fareForAge(-1)).toThrow(ValidationError);
    expect(() => fareForAge(121)).toThrow(ValidationError);
    expect(() => fareForAge(5.5)).toThrow(ValidationError);
  });

  it("TC-06: total fare for one adult and one child is Nu. 450", () => {
    expect(totalFare([30, 8])).toBe(450);
  });
});