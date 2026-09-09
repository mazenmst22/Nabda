import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readdir } from "node:fs/promises";
import path from "node:path";

async function appPageCount(directory: string): Promise<number> {
  const entries = await readdir(directory, { withFileTypes: true });
  let count = entries.some((entry) => entry.isFile() && entry.name === "page.tsx") ? 1 : 0;
  for (const entry of entries) {
    if (entry.isDirectory()) count += await appPageCount(path.join(directory, entry.name));
  }
  return count;
}

test("preview harness renders real routes and controls the iframe", async ({ page }) => {
  await page.goto("/ar/dev/preview");
  const harness = page.locator(".preview-harness");
  await expect(harness).toHaveAttribute("data-preview-ready", "true");

  const frame = page.frameLocator("iframe[title^='Preview:']");
  await expect(frame.locator("html")).toHaveAttribute("lang", "ar");
  await expect(frame.locator("html")).toHaveAttribute("dir", "rtl");

  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(harness).toHaveAttribute("data-preview-ready", "true");
  await expect(frame.locator("html")).toHaveAttribute("lang", "en");
  await expect(frame.locator("html")).toHaveAttribute("dir", "ltr");

  await page.getByRole("button", { name: "dark", exact: true }).click();
  await expect(frame.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "1280", exact: true }).click();
  const iframe = page.locator("iframe[title^='Preview:']");
  await expect(iframe).toHaveCSS("width", "1280px");
  await expect(iframe).not.toHaveCSS("transform", "none");

  const current = page.locator(".preview-rail button[aria-current='page']");
  const currentId = await current.getAttribute("data-preview-entry-id");
  await current.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".preview-rail button[aria-current='page']")).not.toHaveAttribute(
    "data-preview-entry-id",
    currentId ?? "",
  );
  await expect(harness).toHaveAttribute("data-preview-ready", "true");

  const accessibility = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(accessibility.violations).toEqual([]);
});

test("the generated rail includes every App Router page", async ({ page }) => {
  await page.goto("/en/dev/preview");
  const expectedRoutes = await appPageCount(path.join(process.cwd(), "src", "app", "[locale]"));
  await expect(page.locator("[data-preview-entry-id$='--happy']")).toHaveCount(expectedRoutes);
  await expect(page.locator("[data-preview-entry-id='patient--happy']")).toBeVisible();
  await expect(page.locator("[data-preview-entry-id='doctor--invalid-json']")).toBeVisible();
  await expect(
    page.locator("[data-preview-entry-id='doctor--mariam-fouad--slot-taken']"),
  ).toBeVisible();
});

test("every discovered happy route mounts inside the real iframe", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/en/dev/preview");
  const harness = page.locator(".preview-harness");
  const ids = await page
    .locator("[data-preview-entry-id$='--happy']")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-preview-entry-id") ?? ""),
    );

  for (const id of ids) {
    const entry = page.locator(`[data-preview-entry-id='${id}']`);
    const route = (await entry.getAttribute("data-preview-route")) ?? "/";
    await entry.click();
    await expect(harness).toHaveAttribute("data-preview-entry", id);
    await expect
      .poll(async () => {
        const source = await page.locator("iframe[title^='Preview:']").getAttribute("src");
        return source ? new URL(source, "http://localhost:3000").pathname : "";
      })
      .toBe(route === "/" ? "/en" : `/en${route}`);
    await expect(harness).toHaveAttribute("data-preview-ready", "true", { timeout: 30_000 });
    const body = page.frameLocator("iframe[title^='Preview:']").locator("body");
    await expect(body).not.toContainText("This page could not be found");
    await expect(body).not.toContainText("Access denied");
  }
});

test("scenario entries use real RBAC, booking, and extraction states", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/en/dev/preview");
  const harness = page.locator(".preview-harness");
  const frame = page.frameLocator("iframe[title^='Preview:']");

  async function selectScenario(id: string, scenario: string) {
    await page.locator(`[data-preview-entry-id='${id}']`).click();
    await expect(harness).toHaveAttribute("data-preview-entry", id);
    await expect
      .poll(() => page.locator("iframe[title^='Preview:']").getAttribute("src"))
      .toContain(`mswScenario=${scenario}`);
    await expect(harness).toHaveAttribute("data-preview-ready", "true", { timeout: 30_000 });
  }

  await selectScenario("patient--permission-denied", "permission-denied");
  await expect(frame.locator("body")).toContainText("Access denied");

  await selectScenario("doctor--mariam-fouad--slot-taken", "slot-taken");
  await expect(frame.locator(".booking-alternatives button")).toHaveCount(3);

  const invalidRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/v1/encounters/") && request.url().endsWith("/prescriptions"),
  );
  await selectScenario("doctor--invalid-json", "invalid-json");
  const request = await invalidRequest;
  await expect(request.headerValue("X-Nabda-MSW-Scenario")).resolves.toBe("invalid-json");
  expect((await request.response())?.status()).toBe(422);
  await expect(frame.locator("[data-extraction-state='invalid']")).toBeVisible();
  await expect(frame.locator(".medication-review-table")).toHaveCount(0);
});
