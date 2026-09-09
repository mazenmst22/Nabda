import { expect, test, type Page } from "@playwright/test";

type Role = "patient" | "receptionist" | "developer";

function sessionCookie(role: Role) {
  const identities = {
    patient: { id: "usr-amal", name: "Amal Hassan", email: "amal@example.test" },
    receptionist: { id: "usr-dina", name: "Dina Adel", email: "dina@example.test" },
    developer: { id: "usr-youssef", name: "Youssef Kamal", email: "youssef@example.test" },
  };
  return Buffer.from(
    JSON.stringify({
      user: identities[role],
      roles: [role],
      clinicId: role === "patient" ? null : "clinic-maadi",
      patientId: role === "patient" ? "patient-amal" : undefined,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
}

async function setRole(page: Page, role: Role | null) {
  await page.context().clearCookies();
  if (!role) return;
  await page
    .context()
    .addCookies([
      { name: "nabda_mock_session", value: sessionCookie(role), url: "http://localhost:3000" },
    ]);
}

const shells = [
  { name: "public", path: "", role: null, marker: "public" },
  { name: "patient", path: "/patient", role: "patient" as const, marker: "patient" },
  { name: "staff", path: "/reception", role: "receptionist" as const, marker: "staff" },
  { name: "developer", path: "/developer", role: "developer" as const, marker: "developer" },
];

for (const locale of ["ar", "en"] as const) {
  for (const width of [320, 768, 1280]) {
    test(`all shells fit ${width}px in ${locale}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const shell of shells) {
        await setRole(page, shell.role);
        await page.goto(`/${locale}${shell.path}`);
        await expect(page.locator(`[data-shell="${shell.marker}"]`)).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        const offenders =
          overflow > 1
            ? await page.evaluate(() =>
                [...document.querySelectorAll<HTMLElement>("body *")]
                  .map((element) => ({
                    element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[
                      ...element.classList,
                    ]
                      .slice(0, 3)
                      .map((name) => `.${name}`)
                      .join("")}`,
                    text: element.textContent?.trim().slice(0, 50),
                    href:
                      element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
                    parent: element.parentElement
                      ? `${element.parentElement.tagName.toLowerCase()}.${[...element.parentElement.classList].join(".")}`
                      : null,
                    start: Math.round(element.getBoundingClientRect().left),
                    end: Math.round(element.getBoundingClientRect().right),
                  }))
                  .filter(({ start, end }) => start < -1 || end > innerWidth + 1)
                  .slice(0, 8),
              )
            : [];
        expect(
          overflow,
          `${shell.name} shell overflows at ${width}px/${locale}: ${JSON.stringify(offenders)}`,
        ).toBeLessThanOrEqual(1);
      }
    });
  }
}

test("a receptionist receives a generic 403 from the doctor workspace", async ({ page }) => {
  await setRole(page, "receptionist");
  const response = await page.goto("/en/doctor");
  expect(response?.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("doctor-mariam");
});
