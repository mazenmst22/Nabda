import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function sessionCookie(role: "doctor" | "patient") {
  return Buffer.from(
    JSON.stringify(
      role === "doctor"
        ? {
            user: {
              id: "usr-mariam",
              name: "Dr Mariam Fouad",
              email: "mariam@maadi.example.test",
            },
            roles: ["doctor"],
            clinicId: "clinic-maadi",
            doctorId: "dr-mariam-fouad",
            exp: Math.floor(Date.now() / 1000) + 3600,
          }
        : {
            user: { id: "usr-amal", name: "Amal Hassan", email: "amal@example.test" },
            roles: ["patient"],
            clinicId: null,
            patientId: "patient-amal",
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
    ),
  ).toString("base64url");
}

async function signIn(page: Page, role: "doctor" | "patient") {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: sessionCookie(role),
      url: "http://localhost:3000",
    },
  ]);
}

async function openClinicalReview(page: Page) {
  await signIn(page, "doctor");
  await page.request.delete("/api/testing/doctor");
  await page.goto("/en/doctor");
  await expect(page.getByRole("heading", { name: "Medication extraction review" })).toBeVisible();
}

async function acknowledgeLowConfidenceFields(page: Page) {
  await page.getByRole("checkbox", { name: "Acknowledge Dose for Bisoprolol" }).check();
  await page.getByRole("checkbox", { name: "Acknowledge Duration for Bisoprolol" }).check();
}

test("inline transcript edits create a new version and preserve the source version", async ({
  page,
}) => {
  await openClinicalReview(page);
  const transcript = page.locator(".clinical-review-panel").first();
  const firstSegment = transcript.locator(".transcript-segment").first();
  await firstSegment.getByRole("button", { name: "Edit segment" }).click();
  await firstSegment
    .getByLabel("Edit segment 1")
    .fill("الضغط 120/80 at 9:30 مساءً، والمريضة مستقرة.");
  await firstSegment.getByRole("button", { name: "Save as new version" }).click();

  await expect(transcript.getByRole("button", { name: /Version 3/u })).toBeVisible();
  await expect(transcript.locator(".clinical-diff-list")).toContainText("120/80");
  await expect(firstSegment.locator(".clinical-bidi-text > .ltr")).toHaveCount(2);
  await transcript.getByRole("button", { name: /Version 2/u }).click();
  await expect(transcript).not.toContainText("والمريضة مستقرة");
});

test("low-confidence fields block approval until each is explicitly acknowledged", async ({
  page,
}) => {
  await openClinicalReview(page);
  const review = page.locator(".extraction-review");
  await expect(review.locator("[data-review-status='unapproved']")).toBeVisible();
  await expect(review.locator(".medication-field[data-confidence='low']")).toHaveCount(2);
  const approve = review.getByRole("button", { name: "Review and approve" });
  await expect(approve).toBeDisabled();

  await review.getByRole("checkbox", { name: "Acknowledge Dose for Bisoprolol" }).check();
  await expect(approve).toBeDisabled();
  await review.getByRole("checkbox", { name: "Acknowledge Duration for Bisoprolol" }).check();
  await expect(approve).toBeEnabled();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("editing then approving creates attributable draft and approved versions", async ({
  page,
}) => {
  await openClinicalReview(page);
  await acknowledgeLowConfidenceFields(page);
  const review = page.locator(".extraction-review");
  const dose = review.getByRole("spinbutton", { name: "Dose for Bisoprolol" });
  await dose.fill("2.5");
  await expect(review.getByText("Edited by Dr Mariam Fouad")).toBeVisible();
  await review.getByRole("button", { name: "Review and approve" }).click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Approve this prescription version?" }),
  ).toBeVisible();
  await expect(dialog.getByText("Bisoprolol", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Paracetamol", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Approve prescription" }).click();

  await expect(review.locator("[data-review-status='approved']")).toBeVisible();
  await expect(review.getByText("Approved · version 3", { exact: true })).toBeVisible();
  await expect(review.locator(".clinical-version-strip button")).toHaveCount(3);
  await review.getByRole("button", { name: /Version 2/u }).click();
  await expect(review.locator(".clinical-diff-list")).toContainText("2.5");

  const state = await (await page.request.get("/api/testing/doctor")).json();
  expect(state.prescriptionVersions).toBe(3);
});

test("invalid extraction JSON renders no partial medication data and offers re-extraction", async ({
  page,
}) => {
  await signIn(page, "doctor");
  await page.request.delete("/api/testing/doctor");
  await page.request.post("/api/testing/doctor", {
    data: { extractionMode: "invalid" },
  });
  await page.goto("/en/doctor");

  const failure = page.locator("[data-extraction-state='invalid']");
  await expect(failure).toBeVisible();
  await expect(failure).toContainText("did not return valid JSON");
  await expect(page.locator(".medication-review-table")).toHaveCount(0);
  await expect(page.locator(".clinical-review-workspace")).not.toContainText("Bisoprolol");
  await failure.getByRole("button", { name: "Run extraction again" }).click();
  await expect(page.getByRole("heading", { name: "Medication extraction review" })).toBeVisible();
});

test("an unapproved clinical draft never leaks into the patient prescription route", async ({
  page,
}) => {
  await page.request.delete("/api/testing/doctor");
  await signIn(page, "patient");
  await page.goto("/en/patient/prescriptions");

  await expect(page.getByText("Approved clinical record")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Unapproved clinical draft");
  await expect(page.locator("body")).not.toContainText("Bisoprolol");
  await expect(page.locator("body")).not.toContainText("prescription-review-amal");
});
