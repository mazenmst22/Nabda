import { expect, test, type Page } from "@playwright/test";
import { localizedPath, useRole, type Locale } from "./support/app-routes";

const copy = {
  en: {
    query: "Mariam",
    doctor: "Dr Mariam Fouad",
    bookingConfirmed: "Your booking is confirmed",
    preferencesSaved: "Preferences saved",
    rescheduled: "The clinic confirmed the new time. The old time has been released.",
    cancelled: "The clinic confirmed the cancellation.",
    receptionCommitted: "The scheduling service confirmed",
    prescriptionApproved: "Clinician approved",
    approvedRecord: "Approved clinical record",
    approvePrescription: "Approve prescription",
  },
  ar: {
    query: "مريم",
    doctor: "د. مريم فؤاد",
    bookingConfirmed: "الحجز اتأكد",
    preferencesSaved: "التفضيلات اتحفظت.",
    rescheduled: "العيادة أكدت المعاد الجديد. المعاد القديم بقى متاح.",
    cancelled: "العيادة أكدت إلغاء المعاد.",
    receptionCommitted: "أكدت خدمة الجدولة",
    prescriptionApproved: "معتمد من الطبيب",
    approvedRecord: "سجل طبي معتمد",
    approvePrescription: "اعتماد الوصفة",
  },
} as const;

async function assertDocumentDirection(page: Page, locale: Locale) {
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
}

async function installFakeMicrophone(page: Page) {
  await page.addInitScript(() => {
    const track = { stop() {} };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          return { getTracks: () => [track] };
        },
      },
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });

    class FakeMediaRecorder extends EventTarget {
      static isTypeSupported() {
        return true;
      }
      state: RecordingState = "inactive";
      mimeType: string;
      constructor(_: MediaStream, options?: MediaRecorderOptions) {
        super();
        this.mimeType = options?.mimeType ?? "audio/webm";
      }
      start() {
        this.state = "recording";
      }
      pause() {
        this.state = "paused";
      }
      resume() {
        this.state = "recording";
      }
      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive";
        const event = new Event("dataavailable");
        Object.defineProperty(event, "data", {
          value: new Blob(["nabda-golden-path-audio"], { type: this.mimeType }),
        });
        this.dispatchEvent(event);
        this.dispatchEvent(new Event("stop"));
      }
    }
    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: FakeMediaRecorder,
    });
  });
}

test.describe("release golden paths", () => {
  test.describe.configure({ mode: "serial" });

  for (const locale of ["ar", "en"] satisfies Locale[]) {
    test(`patient lifecycle is committed end to end in ${locale}`, async ({ context, page }) => {
      test.setTimeout(120_000);
      await page.request.delete("/api/testing/booking");
      await useRole(context, "public");
      await page.goto(localizedPath(locale, ""));
      await assertDocumentDirection(page, locale);

      await page.locator("#doctor-search").fill(copy[locale].query);
      await page.locator("form[role='search']").getByRole("button").click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/search\\?q=`));
      const doctorCard = page
        .locator(".doctor-card")
        .filter({ hasText: copy[locale].doctor })
        .first();
      await expect(doctorCard).toBeVisible();
      await doctorCard.locator(".slot-button").click();

      const booking = page.locator(".booking-panel");
      await expect(booking).toHaveAttribute("data-booking-stage", "selecting");
      await booking.locator(".booking-primary").click();
      await expect(booking).toHaveAttribute("data-booking-stage", "identity");
      await expect(booking.getByTestId("hold-countdown")).toBeVisible();
      await booking.locator("input[name='fullName']").fill("Mona Adel");
      await booking.locator("input[name='phone']").fill("+201001112233");
      await booking.locator("input[name='email']").fill("mona@example.test");
      await booking.locator("form").getByRole("button").click();
      await expect(booking).toHaveAttribute("data-booking-stage", "review");
      await booking.getByTestId("commit-booking").click();
      await expect(booking).toHaveAttribute("data-booking-stage", "confirmed");
      await expect(booking).toContainText(copy[locale].bookingConfirmed);
      const bookingState = await (await page.request.get("/api/testing/booking")).json();
      expect(bookingState.appointmentCount).toBe(1);

      await useRole(context, "patient");
      await page.goto(localizedPath(locale, "/patient/notifications"));
      await assertDocumentDirection(page, locale);
      const optionalPreference = page
        .locator(".patient-notification-matrix input:not(:disabled)")
        .first();
      await optionalPreference.setChecked(!(await optionalPreference.isChecked()));
      await page.locator(".patient-preference-footer button").click();
      await expect(page.locator(".patient-preference-footer")).toContainText(
        copy[locale].preferencesSaved,
      );

      await page.goto(localizedPath(locale, "/patient/appointments/appointment-upcoming-mariam"));
      const appointmentActions = page.locator(".patient-detail-actions button");
      await appointmentActions.first().click();
      await page.locator(".patient-reschedule-action").click();
      await expect(page.locator(".patient-hold-countdown")).toBeVisible();
      const moveResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "PATCH" &&
          response.url().includes("/v1/appointments/appointment-upcoming-mariam"),
      );
      await page.locator(".patient-reschedule-action").click();
      const moveResponse = await moveResponsePromise;
      expect(moveResponse.status(), await moveResponse.text()).toBe(200);
      await expect(page.getByRole("status")).toContainText(copy[locale].rescheduled);

      await page.locator(".patient-detail-actions button").nth(1).click();
      const cancelDialog = page.getByRole("dialog");
      await expect(cancelDialog).toBeVisible();
      await cancelDialog.locator(".ui-overlay__footer button").last().click();
      await expect(page.getByRole("status")).toContainText(copy[locale].cancelled);
      await expect(page.locator(".patient-detail-actions")).toHaveCount(0);
    });

    test(`clinical lifecycle preserves the approval boundary in ${locale}`, async ({
      context,
      page,
    }) => {
      test.setTimeout(150_000);
      await page.request.delete("/api/testing/booking");
      await page.request.delete("/api/testing/reception");
      await page.request.delete("/api/testing/doctor");

      await useRole(context, "receptionist");
      await page.goto(localizedPath(locale, "/reception"));
      await assertDocumentDirection(page, locale);
      await page.locator(".reception-page-header button").click();
      const receptionDialog = page.getByRole("dialog");
      await expect(receptionDialog).toBeVisible();
      await receptionDialog.getByTestId("commit-reception-booking").click();
      await expect(page.locator("body")).toContainText(copy[locale].receptionCommitted);
      await expect((await page.request.get("/api/testing/booking")).json()).resolves.toMatchObject({
        appointmentCount: 1,
      });

      await installFakeMicrophone(page);
      await useRole(context, "doctor");
      await page.goto(localizedPath(locale, "/doctor"));
      await assertDocumentDirection(page, locale);
      await page.locator(".doctor-page-header button").click();
      const consentGate = page.locator(".doctor-consent-gate");
      await consentGate.locator("input[type='checkbox']").check();
      await consentGate.locator("button").click();
      await expect(consentGate).toHaveClass(/is-granted/u);

      const capture = page.locator(".audio-capture");
      await capture
        .locator("button")
        .filter({ has: page.locator("svg") })
        .first()
        .click();
      await expect(capture).toHaveAttribute("data-capture-state", "recording");
      await capture.locator("button").last().click();
      await expect(capture).toHaveAttribute("data-capture-state", "done", { timeout: 15_000 });
      await expect(capture).toHaveAttribute("data-browser-audio-held", "false");

      const transcript = page.locator(".clinical-review-panel").first();
      const firstSegment = transcript.locator(".transcript-segment").first();
      await firstSegment.locator("footer button").click();
      const editor = firstSegment.locator("textarea");
      await editor.fill("الضغط 120/80 at 9:30 مساءً، والمريضة مستقرة.");
      await firstSegment.locator(".transcript-inline-editor button").last().click();
      await expect(transcript.locator(".clinical-version-strip button")).toHaveCount(3);

      const review = page.locator(".extraction-review");
      await expect(review.locator("[data-review-status='unapproved']")).toBeVisible();
      for (const acknowledgement of await review.locator(".clinical-acknowledgement input").all()) {
        await acknowledgement.check();
      }
      await review.locator("input[type='number']").first().fill("2.5");
      await review.locator(".clinical-approval-actions button").click();
      const approvalDialog = page.getByRole("dialog");
      await approvalDialog.getByRole("button", { name: copy[locale].approvePrescription }).click();
      await expect(review.locator("[data-review-status='approved']")).toBeVisible({
        timeout: 15_000,
      });
      await expect(review).toContainText(copy[locale].prescriptionApproved);
      await expect((await page.request.get("/api/testing/doctor")).json()).resolves.toMatchObject({
        consentCount: 1,
        encounterCount: 1,
        uploadCount: 1,
        prescriptionVersions: 3,
      });

      await useRole(context, "patient");
      await page.goto(localizedPath(locale, "/patient/prescriptions"));
      await assertDocumentDirection(page, locale);
      await expect(page.locator("body")).toContainText(copy[locale].approvedRecord);
      await expect(page.locator(".patient-prescription-card")).toContainText("Paracetamol");
      await expect(page.locator("body")).not.toContainText("draft-extraction");
    });
  }
});
