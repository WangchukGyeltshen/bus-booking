   import { Route } from "./config";
   import { ConflictError, NotFoundError } from "./errors";
   import { totalFare } from "./pricing";
   import { calculateRefund } from "./refund";
   import {
     validateName, validatePhone, validateRoute, validateSeats, validateTravelDate,
   } from "./validation";

   /** One passenger and the seat they sit in. */
   export interface PassengerSeat {
     seat: number;
     age: number;
   }

   /** Data sent by the user to make a booking. */
   export interface BookingRequest {
     name: string;
     phone: string;
     route: string;
     date: string;
     passengers: PassengerSeat[];
   }

   /** A stored booking. */
   export interface Booking {
     id: string;
     name: string;
     phone: string;
     route: Route;
     date: string;
     passengers: PassengerSeat[];
     totalFare: number;
     status: "CONFIRMED" | "CANCELLED";
     refund?: number;
   }

   // NOTE: global in-memory store shared by everything (to be improved later)
   const bookings: Booking[] = [];
   let nextId = 1;

   /** Seats already taken (confirmed bookings only) on a route and date. */
   export function getBookedSeats(route: string, date: string): number[] {
     return bookings
       .filter((b) => b.route === route && b.date === date && b.status === "CONFIRMED")
       .flatMap((b) => b.passengers.map((p) => p.seat))
       .sort((a, b) => a - b);
   }

   /** Validates a request, checks seat availability and saves the booking. */
   export function createBooking(req: BookingRequest): Booking {
     const name = validateName(req.name);
     const phone = validatePhone(req.phone);
     const route = validateRoute(req.route);
     const date = validateTravelDate(req.date);
     const passengers = req.passengers ?? [];
     const seats = validateSeats(passengers.map((p) => p.seat));
     const fare = totalFare(passengers.map((p) => p.age));

     const taken = getBookedSeats(route, date);
     const clash = seats.filter((s) => taken.includes(s));
     if (clash.length > 0) {
       throw new ConflictError(`Seat(s) already booked: ${clash.join(", ")}`);
     }

     const booking: Booking = {
       id: `BK-${String(nextId++).padStart(4, "0")}`,
       name, phone, route, date, passengers,
       totalFare: fare,
       status: "CONFIRMED",
     };
     bookings.push(booking);
     return booking;
   }

   /** Finds a booking by its ID. */
   export function getBooking(id: string): Booking {
     const booking = bookings.find((b) => b.id === id);
     if (!booking) throw new NotFoundError(`Booking ${id} not found`);
     return booking;
   }

   /** Cancels a booking, frees its seats and records the refund. */
   export function cancelBooking(id: string): Booking {
     const booking = getBooking(id);
     if (booking.status === "CANCELLED") {
       throw new ConflictError(`Booking ${id} is already cancelled`);
     }
     // NOTE: uses the real clock (to be improved later)
     booking.refund = calculateRefund(booking.totalFare, booking.date, new Date());
     booking.status = "CANCELLED";
     return booking;
   }