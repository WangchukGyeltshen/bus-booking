import {
  ROUTES, Route, TOTAL_SEATS, MIN_SEATS_PER_BOOKING, MAX_SEATS_PER_BOOKING,
  MAX_DAYS_AHEAD, NAME_MIN_LENGTH, NAME_MAX_LENGTH, PHONE_PATTERN,
} from "./config";
import { ValidationError } from "./errors";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Name must be 2 to 50 characters after trimming spaces. */
export function validateName(name: string): string {
  // Fix DEF-02: reject non-text values instead of crashing on .trim()
  if (typeof name !== "string") {
    throw new ValidationError("Name must be text");
  }
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Name must be ${NAME_MIN_LENGTH} to ${NAME_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

/** Phone must be 8 digits starting with 17 or 77. */
export function validatePhone(phone: string): string {
  // Fix DEF-02: a number like 17123456 must not pass as a phone string
  if (typeof phone !== "string" || !PHONE_PATTERN.test(phone)) {
    throw new ValidationError("Phone must be 8 digits starting with 17 or 77");
  }
  return phone;
}

/** Route must be one of the supported routes. */
export function validateRoute(route: string): Route {
  if (!ROUTES.includes(route as Route)) {
    throw new ValidationError(`Route must be one of: ${ROUTES.join(", ")}`);
  }
  return route as Route;
}

/** 1 to 4 seats, each a whole number from 1 to 30, with no repeats. */
export function validateSeats(seats: number[]): number[] {
  if (!Array.isArray(seats) ||
      seats.length < MIN_SEATS_PER_BOOKING ||
      seats.length > MAX_SEATS_PER_BOOKING) {
    throw new ValidationError(
      `Select ${MIN_SEATS_PER_BOOKING} to ${MAX_SEATS_PER_BOOKING} seats`,
    );
  }
  for (const seat of seats) {
    if (!Number.isInteger(seat) || seat < 1 || seat > TOTAL_SEATS) {
      throw new ValidationError(`Seat numbers must be from 1 to ${TOTAL_SEATS}`);
    }
  }
  if (new Set(seats).size !== seats.length) {
    throw new ValidationError("The same seat cannot be selected twice");
  }
  return seats;
}

/**
 * Travel date must be YYYY-MM-DD, not in the past,
 * and at most MAX_DAYS_AHEAD days from today.
 * NOTE: reads the system clock directly (to be improved later).
 */
export function validateTravelDate(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr ?? "");
  if (!match) {
    throw new ValidationError("Date must be in YYYY-MM-DD format");
  }
  const [, y, m, d] = match.map(Number);
  const travel = new Date(y, m - 1, d);
  if (travel.getFullYear() !== y || travel.getMonth() !== m - 1 || travel.getDate() !== d) {
    throw new ValidationError("Date does not exist");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((travel.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysAhead < 0) {
    throw new ValidationError("Travel date cannot be in the past");
  }
  if (daysAhead > MAX_DAYS_AHEAD) {
    throw new ValidationError(`Bookings open only ${MAX_DAYS_AHEAD} days ahead`);
  }
  return dateStr;
}