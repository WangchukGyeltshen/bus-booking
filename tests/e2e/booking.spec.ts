   import { test, expect } from "@playwright/test";

   /** Returns a local date string (YYYY-MM-DD) offset from today. */
   function dateOffset(days: number): string {
     const d = new Date();
     d.setDate(d.getDate() + days);
     const mm = String(d.getMonth() + 1).padStart(2, "0");
     const dd = String(d.getDate()).padStart(2, "0");
     return `${d.getFullYear()}-${mm}-${dd}`;
   }

   const seat = (n: number) => `.seat[data-seat="${n}"]`;

   test("TC-33: full workflow, book 2 seats then cancel with 90% refund", async ({ page }) => {
     await page.goto("/");
     await expect(page.locator("#fare-info")).toContainText("Departs daily");

     // Fill in the booking form (3 days ahead, so refund is 90%)
     await page.selectOption("#route", "Thimphu-Phuntsholing");
     await page.fill("#date", dateOffset(3));
     await page.locator("#date").dispatchEvent("change");
     await page.fill("#name", "Wangchuk Gyeltshen");
     await page.fill("#phone", "77123456");

     // Select seats 5 and 6, make seat 6 a child
     await page.click(seat(5));
     await page.click(seat(6));
     await page.fill("#age-6", "8");
     await expect(page.locator("#total")).toHaveText("450");

     // Book
     await page.click("#book-btn");
     const result = page.locator("#booking-result");
     await expect(result).toContainText("Booking confirmed");
     const bookingId = (await result.textContent())!.match(/BK-\d{4}/)![0];
     await expect(page.locator(seat(5))).toBeDisabled();
     await page.screenshot({ path: "test-results/e2e-1-booked.png", fullPage: true });

     // Cancel and check refund (90% of 450 = 405) and seat is free again
     await page.fill("#cancel-id", bookingId);
     await page.click("#cancel-btn");
     await expect(page.locator("#cancel-result")).toContainText("Refund: Nu. 405");
     await expect(page.locator(seat(5))).toBeEnabled();
     await page.screenshot({ path: "test-results/e2e-2-cancelled.png", fullPage: true });
   });

   test("TC-34: UI shows errors for invalid phone and a 5th seat", async ({ page }) => {
     await page.goto("/");
     await expect(page.locator("#fare-info")).toContainText("Departs daily");

     // Try to pick 5 seats
     for (const n of [1, 2, 3, 4, 5]) await page.click(seat(n));
     await expect(page.locator("#booking-result")).toContainText("at most 4 seats");
     await expect(page.locator(".seat.selected")).toHaveCount(4);

     // Invalid phone is rejected by the server
     await page.fill("#name", "Test User");
     await page.fill("#phone", "12345");
     await page.click("#book-btn");
     await expect(page.locator("#booking-result")).toContainText("Phone must be 8 digits");
     await page.screenshot({ path: "test-results/e2e-3-errors.png", fullPage: true });
   });