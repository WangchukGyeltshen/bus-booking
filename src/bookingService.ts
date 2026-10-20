import { Route } from "./config";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
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

/** Returns the current time. Injected so tests can use a fixed clock. */
export type Clock = () => Date;

/**
 * Manages bookings for the bus.
 * Quality Improvement 2: each instance has its OWN booking list (no global state),
 * and receives its clock from outside (Quality Improvement 1), so every test can
 * start from an empty, independent service at a fixed time.
 */
export class BookingService {
  private readonly bookings: Booking[] = [];
  private nextId = 1;

  /** @param clock current time source; defaults to the system clock */
  constructor(readonly clock: Clock = () => new Date()) {}

  /** Seats already taken (confirmed bookings only) on a route and date. */
  getBookedSeats(route: string, date: string): number[] {
    return this.bookings
      .filter((b) => b.route === route && b.date === date && b.status === "CONFIRMED")
      .flatMap((b) => b.passengers.map((p) => p.seat))
      .sort((a, b) => a - b);
  }

  /** Validates a request, checks seat availability and saves the booking. */
  createBooking(req: BookingRequest): Booking {
    // Fix DEF-01: body must be an object (null crashed on req.name)
    if (req === null || typeof req !== "object") {
      throw new ValidationError("Request body must be a JSON object");
    }
    // Fix DEF-02: passengers must be a list of objects (a string crashed on .map)
    if (!Array.isArray(req.passengers) ||
        req.passengers.some((p) => p === null || typeof p !== "object")) {
      throw new ValidationError("Passengers must be a list of { seat, age } objects");
    }
    const name = validateName(req.name);
    const phone = validatePhone(req.phone);
    const route = validateRoute(req.route);
    const date = validateTravelDate(req.date, this.clock());
    const passengers = req.passengers;
    const seats = validateSeats(passengers.map((p) => p.seat));
    const fare = totalFare(passengers.map((p) => p.age));

    const taken = this.getBookedSeats(route, date);
    const clash = seats.filter((s) => taken.includes(s));
    if (clash.length > 0) {
      throw new ConflictError(`Seat(s) already booked: ${clash.join(", ")}`);
    }

    const booking: Booking = {
      id: `BK-${String(this.nextId++).padStart(4, "0")}`,
      name, phone, route, date, passengers,
      totalFare: fare,
      status: "CONFIRMED",
    };
    this.bookings.push(booking);
    return booking;
  }

  /** Finds a booking by its ID. */
  getBooking(id: string): Booking {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) throw new NotFoundError(`Booking ${id} not found`);
    return booking;
  }

  /** Cancels a booking, frees its seats and records the refund. */
  cancelBooking(id: string): Booking {
    const booking = this.getBooking(id);
    if (booking.status === "CANCELLED") {
      throw new ConflictError(`Booking ${id} is already cancelled`);
    }
    booking.refund = calculateRefund(booking.totalFare, booking.date, this.clock());
    booking.status = "CANCELLED";
    return booking;
  }
}
