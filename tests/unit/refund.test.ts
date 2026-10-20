   import { describe, it, expect } from "vitest";
   import { calculateRefund } from "../../src/refund";
   import { ValidationError } from "../../src/errors";

   // Trip on 10 Nov 2026, departing 08:00. Amount paid: Nu. 600.
   const TRIP = "2026-11-10";
   const at = (day: number, hour: number, min = 0) => new Date(2026, 10, day, hour, min);

   describe("Cancellation refund (refund.ts)", () => {
     it("TC-16: 48 hours before departure refunds 90% (Nu. 540)", () => {
       expect(calculateRefund(600, TRIP, at(8, 8))).toBe(540);
     });

     it("TC-17: boundary, exactly 24h gives 90%, 23h59m gives 50%", () => {
       expect(calculateRefund(600, TRIP, at(9, 8, 0))).toBe(540);
       expect(calculateRefund(600, TRIP, at(9, 8, 1))).toBe(300);
     });

     it("TC-18: boundary, exactly 12h gives 50%, 11h59m gives 0%", () => {
       expect(calculateRefund(600, TRIP, at(9, 20, 0))).toBe(300);
       expect(calculateRefund(600, TRIP, at(9, 20, 1))).toBe(0);
     });

     it("TC-19: cancelling after departure is rejected", () => {
       expect(() => calculateRefund(600, TRIP, at(10, 8, 1))).toThrow(ValidationError);
     });
   });