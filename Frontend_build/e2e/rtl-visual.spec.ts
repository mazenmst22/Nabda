import { expect, test } from "@playwright/test";
import { appRoutes, localizedPath, useRole } from "./support/app-routes";

const visualRouteNames = new Set([
  "home",
  "search",
  "doctor-profile",
  "patient",
  "reception",
  "doctor-workspace",
  "developer",
  "dev-ui",
]);
const visualRoutes = appRoutes.filter((route) => visualRouteNames.has(route.name));

test.describe("RTL visual regression", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  for (const width of [390, 1280]) {
    for (const route of visualRoutes) {
      test(`${route.name} at ${width}px`, async ({ context, page }) => {
        await Promise.all([
          page.request.delete("/api/testing/booking"),
          page.request.delete("/api/testing/reception"),
          page.request.delete("/api/testing/doctor"),
          page.request.delete("/api/testing/developer"),
        ]);
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
        await page.addInitScript(() => {
          window.localStorage.setItem("nabda-theme", "light");
          window.localStorage.setItem("nabda-numerals", "western");
        });
        await useRole(context, route.role);
        await page.goto(localizedPath("ar", route.path), { waitUntil: "domcontentloaded" });
        await expect(page.locator("h1").first()).toBeVisible();
        if (route.name === "doctor-workspace") {
          await expect(page.locator(".extraction-review [data-review-status]")).toBeVisible({
            timeout: 30_000,
          });
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        await expect(page).toHaveScreenshot(`${route.name}-${width}.png`, {
          animations: "disabled",
          caret: "hide",
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  }
});
