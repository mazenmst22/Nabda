import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function receptionistSession() {
  return Buffer.from(
    JSON.stringify({
      user: { id: "usr-dina", name: "Dina Adel", email: "dina@maadi.example.test" },
      roles: ["receptionist"],
      clinicId: "clinic-maadi",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
}

async function openReception(page: Page, suffix = "") {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: receptionistSession(),
      url: "http://localhost:3000",
    },
  ]);
  await page.request.delete("/api/testing/booking");
  await page.request.delete("/api/testing/reception");
  await page.goto(`/en/reception${suffix}`);
}

test("front desk completes a booking and calls the queue using only the keyboard", async ({
  page,
}) => {
  await openReception(page);

  await page.keyboard.press("/");
  await expect(page.locator("[data-reception-search]")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.locator("[data-reception-search]").blur();

  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New appointment" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Patient")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Doctor")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Available time")).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(dialog.getByTestId("commit-reception-booking")).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(dialog).toBeHidden();
  await expect(page.locator("body")).toContainText("The scheduling service confirmed");
  const booking = await page.request.get("/api/testing/booking");
  await expect(booking.json()).resolves.toMatchObject({ appointmentCount: 1 });

  await page.keyboard.press("j");
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toContainText("moved to Called");
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toContainText(
    "Call the next patient",
  );
});

test("a concurrent schedule edit is recovered without silent data loss", async ({ page }) => {
  await openReception(page, "?appointmentConflict=1");
  const ifMatch: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().includes("reception-appointment-amal")) {
      ifMatch.push(request.headers()["if-match"] ?? "");
    }
  });

  await page.getByTestId("appointment-reception-appointment-amal").click();
  const confirm = page.getByRole("dialog", { name: "Move this appointment?" });
  await expect(confirm).toContainText("أمل حسن");
  await confirm.getByRole("button", { name: "Confirm new time" }).click();

  const recovery = page.getByTestId("version-conflict");
  await expect(recovery).toBeVisible();
  await expect(recovery).toContainText("no change was overwritten");
  expect(ifMatch[0]).toBe("3");
  await recovery.getByRole("button", { name: "Retry the intended move" }).click();
  await expect(recovery).toBeHidden();
  expect(ifMatch).toHaveLength(2);
  expect(ifMatch[1]).toBe("4");
});

test("Pulse human takeover removes the gold software state", async ({ page }) => {
  await openReception(page);
  const pulse = page.locator(".reception-pulse-panel .pulse-chat");
  const before = await pulse
    .locator(".pulse-core")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  await pulse.getByRole("button", { name: "Talk to clinic staff" }).click();
  await expect(pulse).toHaveClass(/is-handoff/u);
  await expect
    .poll(() =>
      pulse.locator(".pulse-core").evaluate((node) => getComputedStyle(node).backgroundColor),
    )
    .not.toBe(before);
  await expect(pulse).toContainText("Clinic staff");
});

test("the full workspace is contained and accessible at 768px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 960 });
  await openReception(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator(".reception-schedule-scroll")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
