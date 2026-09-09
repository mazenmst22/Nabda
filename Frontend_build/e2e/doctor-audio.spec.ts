import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function doctorSession() {
  return Buffer.from(
    JSON.stringify({
      user: {
        id: "usr-mariam",
        name: "Dr Mariam Fouad",
        email: "mariam@maadi.example.test",
      },
      roles: ["doctor"],
      clinicId: "clinic-maadi",
      doctorId: "dr-mariam-fouad",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
}

async function installFakeMicrophone(page: Page) {
  await page.addInitScript(() => {
    const runtime = window as typeof window & {
      __nabdaGetUserMediaCalls: number;
      __nabdaTrackStops: number;
    };
    runtime.__nabdaGetUserMediaCalls = 0;
    runtime.__nabdaTrackStops = 0;
    const track = {
      stop() {
        runtime.__nabdaTrackStops += 1;
      },
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          runtime.__nabdaGetUserMediaCalls += 1;
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
        const data = new Event("dataavailable");
        Object.defineProperty(data, "data", {
          value: new Blob(["nabda-audio"], { type: this.mimeType }),
        });
        this.dispatchEvent(data);
        this.dispatchEvent(new Event("stop"));
      }
    }

    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: FakeMediaRecorder,
    });
  });
}

async function openDoctor(page: Page) {
  await page.context().addCookies([
    {
      name: "nabda_mock_session",
      value: doctorSession(),
      url: "http://localhost:3000",
    },
  ]);
  await page.request.delete("/api/testing/doctor");
  await page.goto("/en/doctor");
}

async function createEncounterAndConsent(page: Page) {
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page.getByRole("heading", { name: /Encounter with/u })).toBeVisible();
  await page.getByLabel(/patient has read this exact text/u).check();
  await page.getByRole("button", { name: "Record consent" }).click();
  await expect(page.getByText("Current consent", { exact: true })).toBeVisible();
}

test("doctor chart and consented recording complete through authoritative job progress", async ({
  page,
}) => {
  await installFakeMicrophone(page);
  await openDoctor(page);

  await expect(page.getByRole("heading", { name: "My schedule" })).toBeVisible();
  await page.getByRole("tab", { name: "Week" }).click();
  await expect(page.locator(".doctor-schedule--week")).toBeVisible();
  await expect(page.getByText("Patient aggregate", { exact: true })).toBeVisible();
  await expect(page.locator("#doctor-demographics")).toBeVisible();
  await expect(page.locator("#doctor-audit")).toBeVisible();

  await page.getByRole("button", { name: "Start encounter" }).click();
  const capture = page.locator(".audio-capture");
  await capture.getByRole("button", { name: "Start recording" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "consent-required");
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __nabdaGetUserMediaCalls: number }).__nabdaGetUserMediaCalls,
    ),
  ).toBe(0);

  await page.getByLabel(/patient has read this exact text/u).check();
  await page.getByRole("button", { name: "Record consent" }).click();
  await expect(page.getByText("Current consent", { exact: true })).toBeVisible();
  await capture.getByRole("button", { name: "Start recording" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "recording");
  await capture.getByRole("button", { name: "Pause" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "paused");
  await capture.getByRole("button", { name: "Resume" }).click();
  await capture.getByRole("button", { name: "Stop and upload" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "done", { timeout: 20_000 });
  await expect(capture).toHaveAttribute("data-browser-audio-held", "false");
  await expect(capture).toContainText("browser-held audio has been discarded");
  await expect(capture).toContainText("REST-confirmed final state", { timeout: 15_000 });

  const state = await (await page.request.get("/api/testing/doctor")).json();
  expect(state).toMatchObject({ consentCount: 1, encounterCount: 1, uploadCount: 1, jobCount: 1 });
});

test("revoking consent mid-encounter immediately stops and discards browser audio", async ({
  page,
}) => {
  await installFakeMicrophone(page);
  await openDoctor(page);
  await createEncounterAndConsent(page);
  const capture = page.locator(".audio-capture");
  await capture.getByRole("button", { name: "Start recording" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "recording");
  await page.getByRole("button", { name: "Revoke consent" }).click();
  await expect(capture).toHaveAttribute("data-capture-state", "consent-required");
  expect(
    await page.evaluate(
      () => (window as typeof window & { __nabdaTrackStops: number }).__nabdaTrackStops,
    ),
  ).toBeGreaterThan(0);
  const state = await (await page.request.get("/api/testing/doctor")).json();
  expect(state).toMatchObject({ uploadCount: 0, jobCount: 0 });
});

test("doctor workspace passes axe at tablet width", async ({ page }) => {
  await installFakeMicrophone(page);
  await page.setViewportSize({ width: 768, height: 960 });
  await openDoctor(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
