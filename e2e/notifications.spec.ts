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

async function openWorkspace(page: Page, locale: "ar" | "en" = "en") {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: developerSessionCookie(),
      url: "http://localhost:3000",
    },
  ]);
  await page.goto(`/${locale}/developer/notifications`);
  await expect(
    page.getByRole("heading", {
      name: locale === "ar" ? "التنبيهات والتذكيرات" : "Notifications and reminders",
    }),
  ).toBeVisible();
}

test("Arabic SMS preview substitutes appointment data and reports UCS-2 segments", async ({
  page,
}) => {
  await openWorkspace(page);
  const preview = page.locator(".notification-live-preview .notification-preview");
  await expect(preview).toHaveAttribute("data-locale", "ar");
  await expect(preview).toHaveAttribute("data-channel", "sms");
  await expect(preview.locator(".notification-preview-body")).toContainText("د. مريم فؤاد");
  await expect(preview.locator(".notification-preview-body")).not.toContainText("{doctor}");
  await expect(preview.locator(".notification-sms-metrics")).toHaveAttribute(
    "data-sms-encoding",
    "ucs-2",
  );
  await expect(page.getByText(/70 characters in a single segment/u)).toBeVisible();
  await expect(page.getByText(/160 available to a basic Latin/u)).toBeVisible();
});

test("all bilingual channel variants render from the catalogue", async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole("button", { name: "All previews" }).click();

  await expect(page.locator("[data-template-event]")).toHaveCount(6);
  await expect(page.locator(".notification-preview[data-locale='ar']")).toHaveCount(18);
  await expect(page.locator(".notification-preview[data-locale='en']")).toHaveCount(18);
  await expect(
    page.locator(
      ".notification-preview[data-locale='ar'][data-channel='sms'] [data-sms-encoding='ucs-2']",
    ),
  ).toHaveCount(6);

  const unresolved = await page
    .locator(".notification-preview-body")
    .evaluateAll((nodes) =>
      nodes.filter((node) => /\{[a-zA-Z][a-zA-Z0-9]*\}/u.test(node.textContent ?? "")),
    );
  expect(unresolved).toEqual([]);
});

test("clinic editor inserts variables, updates the live preview, and saves a draft", async ({
  page,
}) => {
  await openWorkspace(page);
  const body = page.getByLabel("Message body");
  await body.click();
  await body.press("Control+A");
  await body.pressSequentially("Clinic note: ");
  await expect(body).toHaveValue("Clinic note: ");
  await page.getByRole("button", { name: /Doctor name/u }).click();
  await expect(body).toHaveValue("Clinic note: {doctor}");
  await expect(page.locator(".notification-live-preview .notification-preview-body")).toContainText(
    "Clinic note: د. مريم فؤاد",
  );
  await page.getByRole("button", { name: "Save template draft" }).click();
  await expect(page.getByText("Draft saved for Booking confirmed.")).toBeAttached();
});

test("send log exposes delivery status per channel and remains accessible", async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole("button", { name: "Send log" }).click();
  const log = page.locator(".notification-send-log");
  await expect(log.getByText("Delivered", { exact: true })).toHaveCount(2);
  await expect(log.getByText("Delivery failed", { exact: true })).toBeVisible();
  await expect(log.locator("[data-status='completed']")).toHaveCount(2);
  await log.getByLabel("Filter by channel").selectOption("sms");
  await expect(log.locator("tbody tr")).toHaveCount(2);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("notification workspace fits a small Arabic viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openWorkspace(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
