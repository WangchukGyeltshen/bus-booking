   /**
    * Business rules for the Bus Ticket Booking System.
    * All rule values live here so they can be changed in one place
    * and referenced by both the application and the tests.
    */

   /** Supported routes (one departure per day on each route). */
   export const ROUTES = ["Phuntsholing-Thimphu", "Thimphu-Phuntsholing"] as const;
   export type Route = (typeof ROUTES)[number];

   /** Daily departure time (24h clock), used for refund calculation. */
   export const DEPARTURE_HOUR = 8;

   /** Seats on each bus, numbered 1 to TOTAL_SEATS. */
   export const TOTAL_SEATS = 30;

   /** Seats allowed in a single booking. */
   export const MIN_SEATS_PER_BOOKING = 1;
   export const MAX_SEATS_PER_BOOKING = 4;

   /** How far ahead a trip can be booked (in days). */
   export const MAX_DAYS_AHEAD = 30;

   /** Passenger name length limits. */
   export const NAME_MIN_LENGTH = 2;
   export const NAME_MAX_LENGTH = 50;

   /** Phone: 8 digits starting with 17 or 77. */
   export const PHONE_PATTERN = /^(17|77)\d{6}$/;

   /** Fares in Ngultrum (Nu.). Children under CHILD_AGE_LIMIT pay a discount. */
   export const ADULT_FARE = 300;
   export const CHILD_AGE_LIMIT = 12;
   export const CHILD_DISCOUNT = 0.5;

   /** Refund percentage based on hours left before departure. */
   export const REFUND_FULL_HOURS = 24; // 24h or more before -> 90%
   export const REFUND_PARTIAL_HOURS = 12; // 12h to under 24h -> 50%
   export const REFUND_FULL_RATE = 0.9;
   export const REFUND_PARTIAL_RATE = 0.5; // under 12h -> 0%