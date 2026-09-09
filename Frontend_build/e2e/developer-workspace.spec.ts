import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function developerSessionCookie() {
  return Buffer.from(
    JSON.stringify({
      user: {
        id: "usr-youssef",
        name: "Youssef Kamal",
        email: "youssef@nabda.example.test",
      },
      roles: ["developer"],
      clinicId: "clinic-maadi",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
}

async function openDeveloperWorkspace(page: Page) {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: developerSessionCookie(),
      url: "http://localhost:3000",
    },
  ]);
  await page.request.delete("/api/testing/developer");
  await page.goto("/en/developer");
  await expect(page.getByRole("heading", { name: "Developer workspace" })).toBeVisible();
}

test("provider secrets stay masked until a fresh step-up check", async ({ page }) => {
  await openDeveloperWorkspace(page);

  const protectedRequest = await page.request.get("/v1/admin/providers/provider-stt/secret");
  expect(protectedRequest.status()).toBe(403);
  await expect(page.locator("body")).not.toContainText("stt_live_");
  await expect(page.locator("[data-provider-secret='provider-stt']")).toContainText("••••");

  await page.getByRole("button", { name: "Reveal provider secrets" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Confirm your identity" })).toBeVisible();
  await dialog.getByRole("button", { name: "Verify identity" }).click();

  await expect(page.locator("[data-provider-secret='provider-stt']")).toContainText("stt_live_");
  expect((await page.request.get("/v1/admin/providers/provider-stt/secret")).status()).toBe(200);
});

test("developer clinical record denials are identical for existing and unknown resources", async ({
  page,
}) => {
  await openDeveloperWorkspace(page);

  const existing = await page.request.get("/v1/encounters/encounter-review-amal/transcript");
  const unknown = await page.request.get("/v1/encounters/resource-that-does-not-exist/transcript");

  expect(existing.status()).toBe(403);
  expect(unknown.status()).toBe(403);
  expect(await existing.json()).toEqual({ code: "NOT_AUTHORIZED", detail: "Access denied" });
  expect(await unknown.json()).toEqual({ code: "NOT_AUTHORIZED", detail: "Access denied" });
});

test("audit log filters ten thousand events off the main interface thread", async ({ page }) => {
  await openDeveloperWorkspace(page);
  const viewer = page.locator(".developer-audit-viewer");
  await expect(viewer).toHaveAttribute("data-audit-source-total", "10000", { timeout: 15_000 });
  await expect(viewer).toHaveAttribute("data-worker-state", "complete");
  await expect(viewer.locator("tbody tr")).toHaveCount(60);

  const heartbeatBefore = Number(await viewer.getAttribute("data-main-thread-heartbeat"));
  await viewer.getByLabel("Actor").fill("developer-youssef");
  await expect(viewer).toHaveAttribute("data-worker-state", "complete");
  await expect(viewer.getByText("2,500 matching events")).toBeVisible();
  const heartbeatAfter = Number(await viewer.getAttribute("data-main-thread-heartbeat"));
  expect(heartbeatAfter).toBeGreaterThan(heartbeatBefore);
  expect(Number(await viewer.getAttribute("data-filter-duration"))).toBeLessThan(100);
});

test("destructive provider changes name the object and explain the consequence", async ({
  page,
}) => {
  await openDeveloperWorkspace(page);
  const provider = page.locator("[data-provider='provider-stt']");
  await provider.getByRole("button", { name: "Disable provider" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Disable mock-stt?" })).toBeVisible();
  await expect(dialog).toContainText("stops new jobs assigned to this adapter");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});
