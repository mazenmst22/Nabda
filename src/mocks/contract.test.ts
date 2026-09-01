import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import type { z } from "zod";
import { ApiClient, ApiValidationError, createApiAction } from "@/lib/api";
import {
  adminAuditListSchema,
  adminFlagListSchema,
  adminFlagSchema,
  adminHealthSchema,
  adminPromptListSchema,
  adminPromptSchema,
  adminProviderListSchema,
  adminProviderSchema,
  adminSettingsSchema,
  appointmentListSchema,
  appointmentSchema,
  audioUploadSchema,
  clinicListSchema,
  clinicSchema,
  consentSchema,
  daySlotsListSchema,
  doctorListSchema,
  doctorSchema,
  encounterSchema,
  holdReleasedSchema,
  holdSchema,
  jobSchema,
  patientListSchema,
  patientSchema,
  patientTimelineSchema,
  prescriptionListSchema,
  prescriptionSchema,
  pulseConfirmationSchema,
  pulseHandoffSchema,
  pulseMessageAcceptedSchema,
  pulseSchema,
  queueListSchema,
  queueSchema,
  specialtyListSchema,
  transcriptSchema,
} from "@/lib/schemas";
import { resetMockControls, setMockOffline } from "./controls";
import {
  appointmentFixture,
  patientFixture,
  prescriptionExtractionFixture,
  transcriptFixture,
} from "./fixtures";
import { server } from "./server";

const baseUrl = "http://nabda.test";
const client = new ApiClient({
  baseUrl,
  getAccessToken: () => "test-access-token",
  getClinicId: () => "clinic-maadi",
  getLocale: () => "ar",
});

type EndpointCase = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  schema: z.ZodType;
  body?: unknown;
  version?: number;
};

const patientInput = {
  fullName: patientFixture.fullName,
  phone: patientFixture.phone,
  email: patientFixture.email,
  dateOfBirth: patientFixture.dateOfBirth,
  gender: patientFixture.gender,
  preferredLanguage: patientFixture.preferredLanguage,
  numeralPreference: patientFixture.numeralPreference,
};

const endpointCases: EndpointCase[] = [
  { method: "GET", path: "/v1/public/clinics", schema: clinicListSchema },
  { method: "GET", path: "/v1/public/clinics/andalusia-maadi", schema: clinicSchema },
  { method: "GET", path: "/v1/public/specialties", schema: specialtyListSchema },
  { method: "GET", path: "/v1/public/doctors", schema: doctorListSchema },
  { method: "GET", path: "/v1/public/doctors/mariam-fouad", schema: doctorSchema },
  {
    method: "GET",
    path: "/v1/public/doctors/dr-mariam-fouad/availability?from=2026-08-29&to=2026-08-30",
    schema: daySlotsListSchema,
  },
  {
    method: "POST",
    path: "/v1/appointments/holds",
    schema: holdSchema,
    body: { doctorId: "dr-mariam-fouad", slotStart: "2026-08-29T09:30:00Z" },
  },
  {
    method: "DELETE",
    path: "/v1/appointments/holds/hold-active",
    schema: holdReleasedSchema,
  },
  {
    method: "POST",
    path: "/v1/appointments",
    schema: appointmentSchema,
    body: { holdId: "hold-active", patientId: "patient-amal", source: "patient_web" },
  },
  { method: "GET", path: "/v1/appointments?patientId=patient-amal", schema: appointmentListSchema },
  { method: "GET", path: "/v1/appointments/appointment-one", schema: appointmentSchema },
  {
    method: "PATCH",
    path: "/v1/appointments/appointment-one",
    schema: appointmentSchema,
    body: { status: "checked_in" },
    version: 2,
  },
  {
    method: "GET",
    path: "/v1/queue?doctorId=dr-mariam-fouad&date=2026-08-29",
    schema: queueListSchema,
  },
  {
    method: "PATCH",
    path: "/v1/queue/queue-one",
    schema: queueSchema,
    body: { state: "called" },
    version: 1,
  },
  { method: "GET", path: "/v1/patients?q=أمل&page=1", schema: patientListSchema },
  { method: "POST", path: "/v1/patients", schema: patientSchema, body: patientInput },
  { method: "GET", path: "/v1/patients/patient-amal", schema: patientSchema },
  {
    method: "PATCH",
    path: "/v1/patients/patient-amal",
    schema: patientSchema,
    body: { preferredLanguage: "en" },
    version: 3,
  },
  { method: "GET", path: "/v1/patients/patient-amal/timeline", schema: patientTimelineSchema },
  {
    method: "POST",
    path: "/v1/consents",
    schema: consentSchema,
    body: {
      patientId: "patient-amal",
      encounterId: "encounter-one",
      purpose: "encounter_audio",
      textVersion: "audio-consent-v2",
    },
  },
  { method: "DELETE", path: "/v1/consents/consent-one", schema: consentSchema },
  {
    method: "POST",
    path: "/v1/encounters",
    schema: encounterSchema,
    body: {
      patientId: "patient-amal",
      appointmentId: "appointment-one",
      doctorId: "dr-mariam-fouad",
    },
  },
  {
    method: "POST",
    path: "/v1/encounters/encounter-one/audio/upload-url",
    schema: audioUploadSchema,
    body: { contentType: "audio/webm", bytes: 1024 },
  },
  {
    method: "POST",
    path: "/v1/encounters/encounter-one/audio/complete",
    schema: jobSchema,
    body: { audioKey: "audio/encounter-one.webm", sha256: "abc123", durationMs: 42000 },
  },
  { method: "GET", path: "/v1/jobs/job-transcription-one", schema: jobSchema },
  { method: "GET", path: "/v1/encounters/encounter-one/transcript", schema: transcriptSchema },
  {
    method: "PATCH",
    path: "/v1/encounters/encounter-one/transcript",
    schema: transcriptSchema,
    body: { segments: transcriptFixture.segments },
    version: 2,
  },
  { method: "POST", path: "/v1/encounters/encounter-one/extraction", schema: jobSchema },
  {
    method: "GET",
    path: "/v1/encounters/encounter-one/prescriptions",
    schema: prescriptionListSchema,
  },
  {
    method: "POST",
    path: "/v1/encounters/encounter-one/prescriptions",
    schema: prescriptionSchema,
    body: { payload: prescriptionExtractionFixture },
  },
  {
    method: "POST",
    path: "/v1/prescriptions/prescription-one/approve",
    schema: prescriptionSchema,
    body: { signature: "clinician-signature" },
  },
  { method: "POST", path: "/v1/pulse/conversations", schema: pulseSchema },
  {
    method: "POST",
    path: "/v1/pulse/conversations/pulse-conversation-one/messages",
    schema: pulseMessageAcceptedSchema,
    body: { text: "محتاج دكتور قلب" },
  },
  {
    method: "POST",
    path: "/v1/pulse/conversations/pulse-conversation-one/confirm",
    schema: pulseConfirmationSchema,
    body: { toolCallId: "tool-one", confirmed: true },
  },
  {
    method: "POST",
    path: "/v1/pulse/conversations/pulse-conversation-one/handoff",
    schema: pulseHandoffSchema,
  },
  { method: "GET", path: "/v1/admin/settings", schema: adminSettingsSchema },
  {
    method: "PATCH",
    path: "/v1/admin/settings",
    schema: adminSettingsSchema,
    body: { retentionDays: 45 },
    version: 4,
  },
  { method: "GET", path: "/v1/admin/providers", schema: adminProviderListSchema },
  {
    method: "PATCH",
    path: "/v1/admin/providers/provider-stt",
    schema: adminProviderSchema,
    body: { timeoutMs: 35000 },
    version: 2,
  },
  { method: "GET", path: "/v1/admin/flags", schema: adminFlagListSchema },
  {
    method: "PATCH",
    path: "/v1/admin/flags/pulse-booking",
    schema: adminFlagSchema,
    body: { enabled: false },
    version: 2,
  },
  { method: "GET", path: "/v1/admin/prompts", schema: adminPromptListSchema },
  {
    method: "POST",
    path: "/v1/admin/prompts",
    schema: adminPromptSchema,
    body: { key: "prescription-extraction", template: "Extract clinician-stated medications." },
  },
  { method: "GET", path: "/v1/admin/audit?page=1", schema: adminAuditListSchema },
  { method: "GET", path: "/v1/admin/health", schema: adminHealthSchema },
];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockControls();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

describe("API contract handlers", () => {
  it("covers all forty-five contract endpoints with schema-valid responses", async () => {
    expect(endpointCases).toHaveLength(45);
    for (const endpoint of endpointCases) {
      const result = await client.request(endpoint.path, endpoint.schema, {
        method: endpoint.method,
        body: endpoint.body,
        ...(endpoint.version === undefined ? {} : { version: endpoint.version }),
        action: createApiAction(),
        retries: 0,
      });
      expect(endpoint.schema.safeParse(result).success, `${endpoint.method} ${endpoint.path}`).toBe(
        true,
      );
    }
  });

  it.each([
    {
      code: "SLOT_TAKEN",
      call: () =>
        client.post("/v1/appointments/holds", holdSchema, {
          doctorId: "dr-mariam-fouad",
          slotStart: "2026-08-29T10:00:00Z",
        }),
    },
    {
      code: "HOLD_EXPIRED",
      call: () =>
        client.post("/v1/appointments", appointmentSchema, {
          holdId: "hold-expired",
          patientId: "patient-amal",
          source: "patient_web",
        }),
    },
    {
      code: "VERSION_CONFLICT",
      call: () =>
        client.patch(
          "/v1/appointments/appointment-one",
          appointmentSchema,
          { status: "cancelled" },
          { version: 99 },
        ),
    },
    {
      code: "PROVIDER_UNAVAILABLE",
      call: () =>
        client.post("/v1/encounters/provider-unavailable/extraction", jobSchema, undefined, {
          retries: 0,
        }),
    },
  ])("returns the $code exercise state", async ({ code, call }) => {
    await expect(call()).rejects.toMatchObject({ envelope: { code } });
  });

  it("attaches mandatory headers and reuses action identifiers across retries", async () => {
    const attempts: Array<Record<string, string | null>> = [];
    let count = 0;
    server.use(
      http.post(`${baseUrl}/v1/patients`, ({ request }) => {
        attempts.push({
          authorization: request.headers.get("Authorization"),
          clinic: request.headers.get("X-Clinic-Id"),
          correlation: request.headers.get("X-Correlation-Id"),
          idempotency: request.headers.get("Idempotency-Key"),
          language: request.headers.get("Accept-Language"),
        });
        count += 1;
        return count === 1
          ? HttpResponse.json({ unavailable: true }, { status: 503 })
          : HttpResponse.json(patientFixture);
      }),
    );

    await client.post("/v1/patients", patientSchema, patientInput, { retries: 1 });
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({
      authorization: "Bearer test-access-token",
      clinic: "clinic-maadi",
      language: "ar",
    });
    expect(attempts[0]?.correlation).toBe(attempts[1]?.correlation);
    expect(attempts[0]?.idempotency).toBe(attempts[1]?.idempotency);
  });

  it("requires If-Match for updates and sends the supplied version", async () => {
    await expect(
      client.request("/v1/appointments/appointment-one", appointmentSchema, {
        method: "PATCH",
        body: { status: "cancelled" },
      }),
    ).rejects.toThrow("If-Match version is required");

    let match: string | null = null;
    server.use(
      http.patch(`${baseUrl}/v1/appointments/appointment-one`, ({ request }) => {
        match = request.headers.get("If-Match");
        return HttpResponse.json(appointmentFixture);
      }),
    );
    await client.patch(
      "/v1/appointments/appointment-one",
      appointmentSchema,
      { status: "cancelled" },
      { version: 2 },
    );
    expect(match).toBe("2");
  });

  it("fails loudly on invalid development responses", async () => {
    server.use(
      http.get(`${baseUrl}/v1/patients/patient-amal`, () => HttpResponse.json({ id: "broken" })),
    );
    await expect(client.get("/v1/patients/patient-amal", patientSchema)).rejects.toBeInstanceOf(
      ApiValidationError,
    );
  });

  it("reports and degrades invalid production responses when a safe fallback exists", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const report = vi.fn();
    const productionClient = new ApiClient({
      baseUrl,
      getAccessToken: () => "test-access-token",
      getClinicId: () => "clinic-maadi",
      getLocale: () => "en",
      onValidationError: report,
    });
    server.use(
      http.get(`${baseUrl}/v1/public/specialties`, () => HttpResponse.json({ broken: true })),
    );

    const result = await productionClient.get("/v1/public/specialties", specialtyListSchema, {
      degrade: () => [],
    });
    expect(result).toEqual([]);
    expect(report).toHaveBeenCalledOnce();
  });

  it("can simulate the device being offline", async () => {
    setMockOffline(true);
    await expect(
      client.get("/v1/admin/health", adminHealthSchema, { retries: 0 }),
    ).rejects.toThrow();
  });
});
