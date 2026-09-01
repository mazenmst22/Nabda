import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { appRoutes, localizedPath, useRole, type Locale } from "./support/app-routes";

test.describe("all application routes", () => {
  for (const locale of ["ar", "en"] satisfies Locale[]) {
    for (const route of appRoutes) {
      test(`${locale} ${route.name} has no detectable axe violations`, async ({
        context,
        page,
      }) => {
        await useRole(context, route.role);
        const response = await page.goto(localizedPath(locale, route.path), {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), `${locale}${route.path}`).toBeLessThan(400);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
        await page.evaluate(() => document.fonts.ready);
        const results = await new AxeBuilder({ page }).analyze();
        const violations = results.violations.map((violation) => ({
          id: violation.id,
          targets: violation.nodes.map((node) => node.target.join(" ")),
        }));
        expect(violations, `${locale}${route.path}`).toEqual([]);
      });
    }
  }
});
