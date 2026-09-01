import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const locales = [
  { locale: "ar", direction: "rtl" },
  { locale: "en", direction: "ltr" },
] as const;

test("the root route defaults to Arabic", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/u);
});

for (const { locale, direction } of locales) {
  test(`${locale} renders with ${direction} document direction`, async ({ page }) => {
    await page.goto(`/${locale}`);

    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);

    await page.goto(`/${locale}/patient`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
