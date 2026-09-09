import { expect, test, type Page } from "@playwright/test";

const doctorPath = "/en/doctor/mariam-fouad";

async function resetBooking(page: Page, signedIn = false) {
  await page.request.delete("/api/testing/booking");
  await page.goto("/en");
  await page.evaluate((value) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if (value) window.localStorage.setItem("nabda.booking.signed-in", "true");
  }, signedIn);
}

async function reachReview(page: Page, scenario?: string) {
  await resetBooking(page, true);
  await page.goto(`${doctorPath}${scenario ? `?bookingScenario=${scenario}` : ""}`);
  const panel = page.locator(".booking-panel");
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await expect(panel).toHaveAttribute("data-booking-stage", "identity");
  await panel.locator(".booking-signed-in").getByRole("button", { name: "Continue" }).click();
  await expect(panel).toHaveAttribute("data-booking-stage", "review");
  return panel;
}

test("happy path confirms only from the appointment response and downloads a calendar event", async ({
  page,
}) => {
  await resetBooking(page);
  await page.goto(doctorPath);
  const panel = page.locator(".booking-panel");
  await expect(panel.getByTestId("booking-fee")).toContainText("EGP");
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await expect(panel.getByTestId("hold-countdown")).toBeVisible();
  await panel.getByLabel("Patient full name").fill("Mona Adel");
  await panel.getByLabel("Mobile number").fill("+201001112233");
  await panel.getByLabel("Email").fill("mona@example.test");
  await panel.locator("form").getByRole("button", { name: "Continue" }).click();
  await expect(panel).toHaveAttribute("data-booking-stage", "review");
  await expect(panel).toContainText("Book free, pay at the clinic");
  await panel.getByTestId("commit-booking").click();
  await expect(panel).toHaveAttribute("data-booking-stage", "confirmed");
  await expect(panel).toContainText("The clinic schedule recorded this appointment");
  await expect(panel.getByTestId("booking-fee")).toContainText("EGP");
  await expect(panel.getByRole("heading", { name: "What happens next" })).toBeVisible();
  const download = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Add to calendar" }).click();
  await expect((await download).suggestedFilename()).toMatch(/\.ics$/u);
});

test("slot taken offers three alternatives with the same doctor", async ({ page }) => {
  await resetBooking(page);
  await page.goto(`${doctorPath}?bookingScenario=slot-taken`);
  const panel = page.locator(".booking-panel");
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await expect(panel.getByText("That time was just booked")).toBeVisible();
  const alternatives = panel.locator(".booking-alternatives button");
  await expect(alternatives).toHaveCount(3);
  await alternatives.first().click();
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await expect(panel).toHaveAttribute("data-booking-stage", "identity");
});

test("expired hold returns to the picker with the intended time selected", async ({ page }) => {
  await resetBooking(page);
  await page.goto(`${doctorPath}?bookingScenario=hold-expired`);
  const panel = page.locator(".booking-panel");
  const selectedTime = await panel
    .locator(".profile-slots button[aria-pressed='true']")
    .textContent();
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await expect(panel.getByTestId("hold-countdown")).toBeVisible();
  await expect(panel).toHaveAttribute("data-booking-stage", "selecting", { timeout: 5_000 });
  await expect(panel.getByText(/temporary hold ended/)).toBeVisible();
  await expect(panel.locator(".profile-slots button[aria-pressed='true']")).toHaveText(
    selectedTime ?? "",
  );
});

test("network retry reuses one idempotency key", async ({ page }) => {
  const keys: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/v1/appointments")) {
      keys.push(request.headers()["idempotency-key"] ?? "");
    }
  });
  const panel = await reachReview(page, "network-retry");
  await panel.getByTestId("commit-booking").click();
  await expect(panel).toHaveAttribute("data-booking-stage", "confirmed");
  expect(keys).toHaveLength(2);
  expect(new Set(keys).size).toBe(1);
  expect(keys[0]).not.toBe("");
});

test("signed-out recovery keeps the chosen slot through the sign-in redirect", async ({ page }) => {
  await resetBooking(page);
  await page.goto(doctorPath);
  const panel = page.locator(".booking-panel");
  const slots = panel.locator(".profile-slots button");
  await slots.nth(1).click();
  const intendedTime = (await slots.nth(1).textContent())?.trim() ?? "";
  await panel.getByRole("button", { name: /Hold this time/ }).click();
  await panel.getByRole("button", { name: "Sign in and keep this time" }).click();
  await expect(page).toHaveURL(/\/en\/sign-in/u);
  await page.getByRole("link", { name: "Continue as Amal Hassan" }).click();
  await expect(page).toHaveURL(/\/en\/doctor\/mariam-fouad/u);
  await expect(panel).toHaveAttribute("data-booking-stage", "identity");
  await expect(panel.getByText("Your chosen time was preserved after sign-in.")).toBeVisible();
  await panel.locator(".booking-signed-in").getByRole("button", { name: "Continue" }).click();
  await expect(panel.locator(".booking-review-list")).toContainText(intendedTime);
});

test("double submit creates one appointment", async ({ page }) => {
  const panel = await reachReview(page);
  await panel.getByTestId("commit-booking").evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(panel).toHaveAttribute("data-booking-stage", "confirmed");
  const response = await page.request.get("/api/testing/booking");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ appointmentCount: 1 });
});
