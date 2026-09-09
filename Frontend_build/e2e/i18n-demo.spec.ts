import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const variant of [
  { locale: "ar", direction: "rtl", languageLabel: "English", alternate: "en" },
  { locale: "en", direction: "ltr", languageLabel: "العربية", alternate: "ar" },
] as const) {
  test(`${variant.locale} i18n demo isolates structured values and passes axe`, async ({
    page,
  }) => {
    await page.goto(`/${variant.locale}/dev/i18n?source=demo`);

    await expect(page.locator("html")).toHaveAttribute("dir", variant.direction);
    await expect(page.locator(".i18n-demo-sentence .ltr")).toHaveCount(3);
    await expect(page.getByRole("link", { name: variant.languageLabel })).toHaveAttribute(
      "href",
      `/${variant.alternate}/dev/i18n?source=demo`,
    );

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
