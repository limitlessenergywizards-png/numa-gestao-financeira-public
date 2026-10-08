import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("landing page loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Numa/i);
  });
});
