import { ADULT_FARE, CHILD_AGE_LIMIT, CHILD_DISCOUNT } from "./config";
import { ValidationError } from "./errors";

/** Maximum realistic passenger age, used to reject bad input. */
export const MAX_AGE = 120;

/**
 * Returns the fare (Nu.) for one passenger.
 * Children under CHILD_AGE_LIMIT get CHILD_DISCOUNT off the adult fare.
 */
export function fareForAge(age: number): number {
  if (!Number.isInteger(age) || age < 0 || age > MAX_AGE) {
    throw new ValidationError(`Age must be a whole number from 0 to ${MAX_AGE}`);
  }
  return age < CHILD_AGE_LIMIT ? ADULT_FARE * (1 - CHILD_DISCOUNT) : ADULT_FARE;
}

/** Returns the total fare (Nu.) for all passengers in a booking. */
export function totalFare(ages: number[]): number {
  return ages.reduce((sum, age) => sum + fareForAge(age), 0);
}