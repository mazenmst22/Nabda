import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const variants = [
  { locale: "ar", direction: "rtl", theme: "light" },
  { locale: "ar", direction: "rtl", theme: "dark" },
  { locale: "en", direction: "ltr", theme: "light" },
  { locale: "en", direction: "ltr", theme: "dark" },
] as const;

for (const variant of variants) {
  test(`${variant.locale} token reference passes axe in ${variant.theme} mode`, async ({
    page,
  }) => {
    await page.addInitScript(
      (theme) => window.localStorage.setItem("nabda-theme", theme),
      variant.theme,
    );
    await page.goto(`/${variant.locale}/dev/tokens`);

    await expect(page.locator("html")).toHaveAttribute("lang", variant.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", variant.direction);
    await expect(page.locator("html")).toHaveAttribute("data-theme", variant.theme);
    await expect(page.locator(".token-card-copy strong").first()).not.toHaveText("—");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("system preference is persisted without forcing a data-theme override", async ({ page }) => {
  await page.goto("/en/dev/tokens");
  await page.getByRole("button", { name: "System" }).click();

  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => window.localStorage.getItem("nabda-theme"))).toBe("system");
});
