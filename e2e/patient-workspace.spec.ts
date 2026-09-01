import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function patientSessionCookie() {
  return Buffer.from(
    JSON.stringify({
      user: { id: "usr-amal", name: "Amal Hassan", email: "amal@example.test" },
      roles: ["patient"],
      clinicId: null,
      patientId: "patient-amal",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
}

async function signInAsPatient(page: Page) {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: patientSessionCookie(),
      url: "http://localhost:3000",
    },
  ]);
}

test("patient workspace keeps records safe and reschedules through a hold", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.delete("/api/testing/booking");
  await signInAsPatient(page);

  await page.goto("/en/patient");
  await expect(page.getByRole("heading", { name: "Good to see you, Amal" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);

  await page.goto("/en/patient/prescriptions");
  await expect(page.getByText("Approved clinical record")).toBeVisible();
  await expect(page.getByText("Prescription from Dr Farida Hassan")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("draft-extraction");

  await page.goto("/en/patient/notifications");
  await expect(page.getByRole("checkbox")).toHaveCount(15);
  await expect(page.getByRole("checkbox", { name: "SMS: Booking confirmed" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "SMS: Cancelled" })).toBeDisabled();

  await page.goto("/en/patient/profile");
  await page.getByRole("button", { name: /Eastern Arabic/u }).click();
  await expect(page.locator(".patient-numeral-preview")).toContainText("٠٩:٣٠");

  await page.goto("/en/patient/appointments/appointment-upcoming-mariam");
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  const cancelDialog = page.getByRole("dialog");
  await expect(cancelDialog.getByRole("heading", { name: /Dr Mariam Fouad/u })).toBeVisible();
  await expect(cancelDialog.getByText("Clinic cancellation policy")).toBeVisible();
  await cancelDialog.getByRole("button", { name: "Keep appointment" }).click();

  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/v1/appointments")) {
      requests.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  await page.getByRole("button", { name: "Reschedule" }).click();
  await page.getByRole("button", { name: "Hold this new time" }).click();
  await expect(page.getByText("Time left")).toBeVisible();
  const movedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      new URL(response.url()).pathname.includes("/v1/appointments/"),
  );
  const releasedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      new URL(response.url()).pathname.includes("/v1/appointments/holds/"),
  );
  await page.getByRole("button", { name: "Confirm the new time" }).click();
  await expect((await movedResponse).status()).toBe(200);
  await expect((await releasedResponse).status()).toBe(200);
  await expect(
    page.getByText("The clinic confirmed the new time. The old time has been released."),
  ).toBeVisible({ timeout: 30_000 });

  const holdIndex = requests.findIndex((request) => request === "POST /v1/appointments/holds");
  const moveIndex = requests.findIndex((request) => request.includes("PATCH /v1/appointments/"));
  expect(holdIndex).toBeGreaterThanOrEqual(0);
  expect(moveIndex).toBeGreaterThan(holdIndex);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});
