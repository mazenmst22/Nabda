import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("mobile product and preview chrome stay readable without overlapping", async ({ page }) => {
  await page.goto("/en/dev/preview?screen=home--happy&theme=light&viewport=390");
  await expect(page.locator(".preview-harness")).toHaveAttribute("data-preview-ready", "true");

  const frame = page.frameLocator("iframe[title^='Preview:']");
  const languageLink = frame.locator("a[href^='/ar']").first();
  await expect(languageLink).toHaveAttribute("lang", "ar");
  await expect(languageLink).toHaveAttribute("dir", "rtl");
  await expect(page.locator("body > .pulse-dock-trigger")).toHaveCount(0);
  await expect(page.locator(".preview-inspector")).toHaveCSS("position", "static");

  const searchLayout = await frame.locator(".hero-search").evaluate((form) => {
    const input = form.querySelector("input")?.getBoundingClientRect();
    const button = form.querySelector("button")?.getBoundingClientRect();
    return {
      inputWidth: input?.width ?? 0,
      inputBottom: input?.bottom ?? 0,
      buttonTop: button?.top ?? 0,
    };
  });
  expect(searchLayout.inputWidth).toBeGreaterThan(250);
  expect(searchLayout.inputBottom).toBeLessThanOrEqual(searchLayout.buttonTop);

  await expect(page.getByRole("button", { name: "Ready", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("[data-preview-entry-id='home--loading']")).toHaveCount(0);
  await page.getByRole("button", { name: /^All/u }).click();
  await expect(page.locator("[data-preview-entry-id='home--loading']")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(accessibility.violations).toEqual([]);
});
