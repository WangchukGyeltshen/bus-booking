   import {
     DEPARTURE_HOUR, REFUND_FULL_HOURS, REFUND_PARTIAL_HOURS,
     REFUND_FULL_RATE, REFUND_PARTIAL_RATE,
   } from "./config";
   import { ValidationError } from "./errors";

   const MS_PER_HOUR = 60 * 60 * 1000;

   /** Departure time for a travel date (YYYY-MM-DD) in local time. */
   export function departureTime(travelDate: string): Date {
     const [y, m, d] = travelDate.split("-").map(Number);
     return new Date(y, m - 1, d, DEPARTURE_HOUR, 0, 0, 0);
   }

   /**
    * Refund (Nu.) for cancelling a booking.
    * 24h or more before departure: 90%
    * 12h to under 24h: 50%
    * under 12h: 0%
    * Cancelling after departure is not allowed.
    * @param now current time, passed in so tests can control it
    */
   export function calculateRefund(amountPaid: number, travelDate: string, now: Date): number {
     const hoursLeft = (departureTime(travelDate).getTime() - now.getTime()) / MS_PER_HOUR;

     if (hoursLeft < 0) {
       throw new ValidationError("Cannot cancel after the bus has departed");
     }
     if (hoursLeft >= REFUND_FULL_HOURS) return Math.round(amountPaid * REFUND_FULL_RATE);
     if (hoursLeft >= REFUND_PARTIAL_HOURS) return Math.round(amountPaid * REFUND_PARTIAL_RATE);
     return 0;
   }