import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function resetPulseBooking(page: Page) {
  await page.request.delete("/api/testing/booking");
  await page.goto("/en/pulse");
}

async function proposeBooking(page: Page) {
  const composer = page.getByLabel("Describe what you need");
  await composer.fill("Book an appointment with Dr Mariam Fouad");
  await page.getByRole("button", { name: "Send" }).click();
  const card = page.locator(".pulse-tool-card");
  await expect(card).toHaveAttribute("data-tool-status", "pending");
  await expect(card).toContainText("Dr Mariam Fouad");
  await expect(card).toContainText("EGP");
  await expect(composer).toBeDisabled();
  return card;
}

test.beforeEach(async ({ page }) => {
  await resetPulseBooking(page);
});

test("propose, confirm, then show only the committed appointment response", async ({ page }) => {
  const card = await proposeBooking(page);
  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      new URL(candidate.url()).pathname === "/v1/appointments",
  );
  await card.getByTestId("pulse-confirm-booking").click();
  expect((await response).ok()).toBe(true);
  await expect(card).toHaveAttribute("data-tool-status", "committed");
  await expect(card.getByText("Appointment reference")).toBeVisible();
  await expect(page.getByText("The clinic schedule committed the appointment.")).toBeVisible();

  const bookingState = await page.request.get("/api/testing/booking");
  await expect(bookingState.json()).resolves.toMatchObject({ appointmentCount: 1 });

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("propose, cancel, and create nothing", async ({ page }) => {
  const card = await proposeBooking(page);
  await card.getByRole("button", { name: "Cancel proposal" }).click();
  await expect(card).toHaveAttribute("data-tool-status", "cancelled");
  await expect(
    page.getByText("The proposal was cancelled. No appointment was created."),
  ).toBeVisible();

  const bookingState = await page.request.get("/api/testing/booking");
  await expect(bookingState.json()).resolves.toMatchObject({ appointmentCount: 0 });
});

test("emergency signal replaces the composer with non-dismissible guidance", async ({ page }) => {
  const composer = page.getByLabel("Describe what you need");
  await composer.fill("I have severe chest pain");
  await page.getByRole("button", { name: "Send" }).click();

  const emergency = page.getByRole("alert");
  await expect(
    emergency.getByRole("heading", { name: "Contact emergency services now" }),
  ).toBeVisible();
  await expect(emergency.getByRole("link", { name: /Ambulance/u })).toHaveAttribute(
    "href",
    /^tel:/u,
  );
  await expect(page.getByLabel("Describe what you need")).toHaveCount(0);
  await expect(emergency.getByText(/There is no dismiss-and-continue option/u)).toBeVisible();
});

test("handoff cross-fades to teal and stops every avatar animation", async ({ page }) => {
  await page.getByRole("button", { name: "Talk to clinic staff" }).click();
  const avatar = page.locator('[data-pulse-state="handoff"]');
  await expect(avatar).toBeVisible();
  await expect(page.getByText("Clinic staff", { exact: true }).first()).toBeVisible();

  await expect
    .poll(() =>
      avatar.evaluate((element) => {
        const core = element.querySelector<HTMLElement>(".pulse-core");
        if (!core) return null;
        const reference = document.createElement("span");
        reference.style.color = "var(--pulse-core)";
        document.body.append(reference);
        const gold = getComputedStyle(reference).color;
        reference.remove();
        const animations = [...element.querySelectorAll<HTMLElement>("*")].map(
          (child) => getComputedStyle(child).animationName,
        );
        return {
          isGold: getComputedStyle(core).backgroundColor === gold,
          allMotionStopped: animations.every((animation) => animation === "none"),
        };
      }),
    )
    .toEqual({ isGold: false, allMotionStopped: true });
});

test("launcher opens a full-screen mobile sheet and a desktop dock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const mobileTrigger = page.getByRole("button", { name: "Open Pulse" });
  await mobileTrigger.click();
  const mobilePanel = page.getByRole("dialog", { name: "What can I help you with?" });
  await expect(mobilePanel).toHaveAttribute("aria-modal", "true");
  const mobileBox = await mobilePanel.boundingBox();
  expect(mobileBox?.width).toBe(390);
  expect(mobileBox?.height).toBe(844);
  await mobilePanel.getByRole("button", { name: "Close Pulse" }).click();
  await expect(mobileTrigger).toBeFocused();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Open Pulse" }).click();
  const desktopPanel = page.getByRole("dialog", { name: "What can I help you with?" });
  await expect(desktopPanel).not.toHaveAttribute("aria-modal", "true");
  const desktopBox = await desktopPanel.boundingBox();
  expect(desktopBox?.width).toBeLessThanOrEqual(430);
  expect(desktopBox?.height).toBeLessThan(900);
});
