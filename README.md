# Bus Ticket Booking System

A small web application for booking bus seats between **Phuntsholing and Thimphu**, built as the practical project for **SWE302 Software Testing & Quality Assurance, Assignment 3**.

Author: Wangchuk Gyeltshen (02240370), College of Science and Technology, RUB

## Features

- Book 1 to 4 seats on a 30-seat bus for a chosen route and date
- Child fare (under 12) at 50% of the adult fare (Nu. 300)
- Double-booking prevention
- Cancellation with time-based refunds (90% / 50% / 0%)

## Business rules

| Rule | Value |
|---|---|
| Routes | Phuntsholing-Thimphu, Thimphu-Phuntsholing (daily, 08:00) |
| Seats | 1 to 30; 1 to 4 per booking; no seat booked twice per trip |
| Travel date | Today up to 30 days ahead |
| Name / Phone | 2 to 50 characters / 8 digits starting with 17 or 77 |
| Age | Whole number 0 to 120 |
| Refund | 24h+ before departure: 90%; 12h to 24h: 50%; under 12h: 0% |

All rule values are defined in `src/config.ts`.

## Tech stack

Node.js 24, TypeScript, Hono (API + static page), Vitest (unit, integration, coverage), Playwright (end-to-end), GitHub Actions (CI).

## Project structure

```
src/
  config.ts           business rule values
  errors.ts           ValidationError (400), ConflictError (409), NotFoundError (404)
  pricing.ts          fare calculation
  validation.ts       input validation
  refund.ts           cancellation refund calculation
  bookingService.ts   BookingService class (bookings, seats, cancellation)
  app.ts              HTTP API (createApp)
  server.ts           starts the server
  public/             web page (index.html, app.js, style.css)
tests/
  unit/               unit tests (Vitest)
  integration/        API integration tests (Vitest)
  e2e/                end-to-end browser tests (Playwright)
```

## Setup and running

```
npm install
npx playwright install chromium   # only needed for e2e tests
npm run dev                       # http://localhost:3000
```

The port can be changed with the `PORT` environment variable.

## Testing

| Command | What it does |
|---|---|
| `npm test` | Unit and integration tests |
| `npm run coverage` | Same, with a coverage report in `coverage/index.html` |
| `npm run test:e2e` | End-to-end browser tests (starts the server automatically) |
| `npm run typecheck` | TypeScript type check |

Every push to `main` runs all of these automatically through GitHub Actions (`.github/workflows/ci.yml`).

## Known setup issue (Windows)

If Vitest fails with `Cannot find native binding` (Rolldown), npm skipped a platform-specific optional dependency (npm bug #4828). Fix it by deleting `node_modules` and `package-lock.json`, then running `npm install` again.
