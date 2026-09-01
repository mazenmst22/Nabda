import { beforeEach, describe, expect, it } from "vitest";
import { POST as requestUploadUrl } from "@/app/v1/encounters/[id]/audio/upload-url/route";
import {
  completeAudio,
  confirmAudioUpload,
  grantConsent,
  resetClinicalStore,
  revokeConsent,
} from "./mock-clinical-store";

describe("server audio consent boundary", () => {
  beforeEach(resetClinicalStore);

  it("rejects missing and revoked consent even when the endpoint is called directly", async () => {
    const encounterId = "encounter-direct-call";
    const request = new Request(
      "http://localhost/v1/encounters/encounter-direct-call/audio/upload-url",
      {
        method: "POST",
        headers: { "X-Correlation-Id": "corr-consent" },
      },
    );
    const missing = await requestUploadUrl(request, {
      params: Promise.resolve({ id: encounterId }),
    });
    expect(missing.status).toBe(409);
    await expect(missing.json()).resolves.toMatchObject({ code: "CONSENT_REQUIRED" });

    const consent = grantConsent(encounterId);
    revokeConsent(consent.id);
    const revoked = await requestUploadUrl(request, {
      params: Promise.resolve({ id: encounterId }),
    });
    expect(revoked.status).toBe(409);
    await expect(revoked.json()).resolves.toMatchObject({ code: "CONSENT_REVOKED" });
  });

  it("reuses one audio key and one completion job across retries", () => {
    const firstUpload = confirmAudioUpload("audio/encounter-one.webm", 1200, "idem-one");
    const retriedUpload = confirmAudioUpload("audio/encounter-one.webm", 1200, "idem-one");
    expect(retriedUpload).toBe(firstUpload);

    const firstJob = completeAudio(firstUpload.audioKey);
    const retriedJob = completeAudio(retriedUpload.audioKey);
    expect(retriedJob).toBe(firstJob);
  });
});
