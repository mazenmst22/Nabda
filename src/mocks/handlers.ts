import { http } from "msw";
import type { ApiErrorCode } from "@/lib/api/errors";
import type { Appointment, Prescription, QueueEntry, Transcript } from "@/lib/schemas";
import { mockJson } from "./controls";
import {
  adminAuditFixtures,
  adminFlagFixtures,
  adminHealthFixture,
  adminPromptFixtures,
  adminProviderFixtures,
  adminSettingsFixture,
  appointmentFixture,
  availabilityFixtures,
  clinicFixtures,
  consentFixture,
  doctorFixtures,
  encounterFixture,
  holdFixture,
  jobFixture,
  patientFixture,
  prescriptionFixture,
  pulseFixture,
  queueFixture,
  specialtyFixtures,
  timelineFixtures,
  transcriptFixture,
} from "./fixtures";

const api = "*/v1";

function page<T>(items: T[], requestedPage = 1) {
  return { items, page: requestedPage, pageSize: items.length || 1, total: items.length };
}

function localizedError(request: Request, code: ApiErrorCode, status: number) {
  const arabic = request.headers.get("Accept-Language") === "ar";
  const copy: Record<ApiErrorCode, { en: string; ar: string }> = {
    SLOT_TAKEN: {
      en: "That slot was booked by another patient.",
      ar: "الموعد ده اتحجز لمريض تاني.",
    },
    HOLD_EXPIRED: { en: "The temporary hold has expired.", ar: "مدة حجز الموعد المؤقت انتهت." },
    VERSION_CONFLICT: {
      en: "This record changed. Refresh before trying again.",
      ar: "السجل اتغيّر. حدّث الصفحة قبل المحاولة.",
    },
    CONSENT_REQUIRED: { en: "Patient consent is required.", ar: "موافقة المريض مطلوبة." },
    CONSENT_REVOKED: { en: "The patient revoked consent.", ar: "المريض سحب الموافقة." },
    NOT_AUTHORIZED: {
      en: "You are not authorised to perform this action.",
      ar: "ليس لديك تصريح لتنفيذ هذا الإجراء.",
    },
    CLINIC_SCOPE_VIOLATION: {
      en: "This action is outside the active clinic.",
      ar: "هذا الإجراء خارج نطاق العيادة الحالية.",
    },
    EXTRACTION_INVALID_JSON: {
      en: "The extraction result was not valid JSON.",
      ar: "نتيجة الاستخراج ليست JSON صالحًا.",
    },
    PROVIDER_UNAVAILABLE: {
      en: "The configured provider is temporarily unavailable.",
      ar: "مزوّد الخدمة غير متاح مؤقتًا.",
    },
    RATE_LIMITED: {
      en: "Too many requests. Try again shortly.",
      ar: "طلبات كثيرة. حاول مرة أخرى بعد قليل.",
    },
    UNKNOWN_ERROR: { en: "The request could not be completed.", ar: "تعذر إكمال الطلب." },
  };
  const detail = arabic ? copy[code].ar : copy[code].en;
  return mockJson(
    {
      type: `https://nabda.health/errors/${code.toLowerCase().replaceAll("_", "-")}`,
      title: detail,
      status,
      code,
      detail,
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status },
  );
}

function byParam<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id) ?? items[0];
}

export const handlers = [
  http.get(`${api}/public/clinics`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLocaleLowerCase();
    const city = url.searchParams.get("city");
    const district = url.searchParams.get("district");
    const items = clinicFixtures.filter(
      (clinic) =>
        (!q || `${clinic.nameAr} ${clinic.nameEn}`.toLocaleLowerCase().includes(q)) &&
        (!city || clinic.city === city) &&
        (!district || clinic.district === district),
    );
    return mockJson(page(items, Number(url.searchParams.get("page") ?? 1)));
  }),
  http.get(`${api}/public/clinics/:slug`, ({ params }) =>
    mockJson(
      clinicFixtures.find((clinic) => clinic.slug === String(params.slug)) ?? clinicFixtures[0],
    ),
  ),
  http.get(`${api}/public/specialties`, () => mockJson(specialtyFixtures)),
  http.get(`${api}/public/doctors`, ({ request }) => {
    const url = new URL(request.url);
    const specialty = url.searchParams.get("specialty");
    const clinicId = url.searchParams.get("clinicId");
    const gender = url.searchParams.get("gender");
    const feeMin = Number(url.searchParams.get("feeMin") ?? 0);
    const feeMax = Number(url.searchParams.get("feeMax") ?? Number.MAX_SAFE_INTEGER);
    const items = doctorFixtures.filter(
      (doctor) =>
        (!specialty || doctor.specialties.includes(specialty)) &&
        (!clinicId || doctor.clinicId === clinicId) &&
        (!gender || doctor.gender === gender) &&
        doctor.fee.amount >= feeMin &&
        doctor.fee.amount <= feeMax,
    );
    return mockJson(page(items, Number(url.searchParams.get("page") ?? 1)));
  }),
  http.get(`${api}/public/doctors/:slug`, ({ params }) =>
    mockJson(
      doctorFixtures.find(
        (doctor) => doctor.slug === String(params.slug) || doctor.id === String(params.slug),
      ) ?? doctorFixtures[0],
    ),
  ),
  http.get(`${api}/public/doctors/:id/availability`, () => mockJson(availabilityFixtures)),

  http.post(`${api}/appointments/holds`, async ({ request }) => {
    const input = (await request.json()) as { doctorId?: string; slotStart?: string };
    if (input.doctorId === "provider-unavailable")
      return localizedError(request, "PROVIDER_UNAVAILABLE", 503);
    if (input.slotStart?.includes("T10:00:00")) return localizedError(request, "SLOT_TAKEN", 409);
    return mockJson(
      {
        ...holdFixture,
        doctorId: input.doctorId ?? holdFixture.doctorId,
        slotStart: input.slotStart ?? holdFixture.slotStart,
      },
      { status: 201 },
    );
  }),
  http.delete(`${api}/appointments/holds/:holdId`, () => mockJson({ released: true })),
  http.post(`${api}/appointments`, async ({ request }) => {
    const input = (await request.json()) as {
      holdId?: string;
      patientId?: string;
      source?: Appointment["source"];
    };
    if (input.holdId === "hold-expired") return localizedError(request, "HOLD_EXPIRED", 409);
    return mockJson(
      {
        ...appointmentFixture,
        patientId: input.patientId ?? appointmentFixture.patientId,
        source: input.source ?? appointmentFixture.source,
      },
      { status: 201 },
    );
  }),
  http.get(`${api}/appointments`, ({ request }) => {
    const url = new URL(request.url);
    return mockJson(page([appointmentFixture], Number(url.searchParams.get("page") ?? 1)));
  }),
  http.get(`${api}/appointments/:id`, () => mockJson(appointmentFixture)),
  http.patch(`${api}/appointments/:id`, async ({ request }) => {
    if (request.headers.get("If-Match") !== String(appointmentFixture.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as {
      status?: Appointment["status"];
      slotStart?: string;
    };
    return mockJson({
      ...appointmentFixture,
      ...(input.status ? { status: input.status } : {}),
      ...(input.slotStart ? { start: input.slotStart } : {}),
      version: appointmentFixture.version + 1,
    });
  }),
  http.get(`${api}/queue`, () => mockJson([queueFixture])),
  http.patch(`${api}/queue/:entryId`, async ({ request }) => {
    if (request.headers.get("If-Match") !== "1")
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as { state?: QueueEntry["state"] };
    return mockJson({ ...queueFixture, state: input.state ?? queueFixture.state });
  }),

  http.get(`${api}/patients`, ({ request }) => {
    const url = new URL(request.url);
    return mockJson(page([patientFixture], Number(url.searchParams.get("page") ?? 1)));
  }),
  http.post(`${api}/patients`, async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    return mockJson(
      {
        ...patientFixture,
        ...input,
        id: patientFixture.id,
        clinicId: patientFixture.clinicId,
        createdAt: patientFixture.createdAt,
        version: 1,
      },
      { status: 201 },
    );
  }),
  http.get(`${api}/patients/:id/timeline`, () => mockJson(timelineFixtures)),
  http.get(`${api}/patients/:id`, () => mockJson(patientFixture)),
  http.patch(`${api}/patients/:id`, async ({ request }) => {
    if (request.headers.get("If-Match") !== String(patientFixture.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as Record<string, unknown>;
    return mockJson({ ...patientFixture, ...input, version: patientFixture.version + 1 });
  }),

  http.post(`${api}/consents`, () => mockJson(consentFixture, { status: 201 })),
  http.delete(`${api}/consents/:id`, () =>
    mockJson({
      ...consentFixture,
      status: "revoked" as const,
      revokedAt: "2026-08-29T10:30:00Z",
      version: 2,
    }),
  ),
  http.post(`${api}/encounters`, () => mockJson(encounterFixture, { status: 201 })),
  http.post(`${api}/encounters/:id/audio/upload-url`, ({ params }) =>
    mockJson({
      uploadUrl: `https://uploads.nabda.test/${String(params.id)}`,
      audioKey: `audio/${String(params.id)}.webm`,
    }),
  ),
  http.post(`${api}/encounters/:id/audio/complete`, () => mockJson(jobFixture, { status: 202 })),
  http.get(`${api}/jobs/:jobId`, () => mockJson(jobFixture)),
  http.get(`${api}/encounters/:id/transcript`, () => mockJson(transcriptFixture)),
  http.patch(`${api}/encounters/:id/transcript`, async ({ request }) => {
    if (request.headers.get("If-Match") !== String(transcriptFixture.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as { segments?: Transcript["segments"] };
    return mockJson({
      ...transcriptFixture,
      segments: input.segments ?? transcriptFixture.segments,
      version: transcriptFixture.version + 1,
    });
  }),
  http.post(`${api}/encounters/:id/extraction`, ({ request, params }) => {
    if (String(params.id) === "provider-unavailable")
      return localizedError(request, "PROVIDER_UNAVAILABLE", 503);
    return mockJson(
      {
        ...jobFixture,
        jobId: "job-extraction-one",
        kind: "extraction" as const,
        state: "queued" as const,
        progress: 0,
      },
      { status: 202 },
    );
  }),
  http.get(`${api}/encounters/:id/prescriptions`, () => mockJson([prescriptionFixture])),
  http.post(`${api}/encounters/:id/prescriptions`, async ({ request }) => {
    const input = (await request.json()) as { payload?: Prescription["payload"] };
    return mockJson(
      { ...prescriptionFixture, payload: input.payload ?? prescriptionFixture.payload },
      { status: 201 },
    );
  }),
  http.post(`${api}/prescriptions/:id/approve`, async ({ request }) => {
    const input = (await request.json()) as { signature?: string };
    return mockJson({
      ...prescriptionFixture,
      status: "approved" as const,
      signature: input.signature ?? "clinician-signature",
      approvedAt: "2026-08-29T10:15:00Z",
      version: 2,
    });
  }),

  http.post(`${api}/pulse/conversations`, () => mockJson(pulseFixture, { status: 201 })),
  http.post(`${api}/pulse/conversations/:id/messages`, ({ params }) =>
    mockJson(
      { conversationId: String(params.id), accepted: true, transport: "sse" as const },
      { status: 202 },
    ),
  ),
  http.post(`${api}/pulse/conversations/:id/confirm`, async ({ request, params }) => {
    const input = (await request.json()) as { toolCallId?: string; confirmed?: boolean };
    return mockJson({
      conversationId: String(params.id),
      toolCallId: input.toolCallId ?? "tool-one",
      confirmed: input.confirmed ?? false,
      status: input.confirmed ? ("confirmed" as const) : ("cancelled" as const),
    });
  }),
  http.post(`${api}/pulse/conversations/:id/handoff`, () =>
    mockJson({ assignedTo: "reception-maadi", status: "human" as const }),
  ),

  http.get(`${api}/admin/settings`, () => mockJson(adminSettingsFixture)),
  http.patch(`${api}/admin/settings`, async ({ request }) => {
    if (request.headers.get("If-Match") !== String(adminSettingsFixture.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as Record<string, unknown>;
    return mockJson({
      ...adminSettingsFixture,
      ...input,
      version: adminSettingsFixture.version + 1,
    });
  }),
  http.get(`${api}/admin/providers`, () => mockJson(adminProviderFixtures)),
  http.patch(`${api}/admin/providers/:id`, async ({ request, params }) => {
    const provider = byParam(adminProviderFixtures, String(params.id));
    if (!provider || request.headers.get("If-Match") !== String(provider.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as Record<string, unknown>;
    return mockJson({ ...provider, ...input, version: provider.version + 1 });
  }),
  http.get(`${api}/admin/flags`, () => mockJson(adminFlagFixtures)),
  http.patch(`${api}/admin/flags/:key`, async ({ request, params }) => {
    const flag =
      adminFlagFixtures.find((item) => item.key === String(params.key)) ?? adminFlagFixtures[0];
    if (!flag || request.headers.get("If-Match") !== String(flag.version))
      return localizedError(request, "VERSION_CONFLICT", 409);
    const input = (await request.json()) as Record<string, unknown>;
    return mockJson({ ...flag, ...input, version: flag.version + 1 });
  }),
  http.get(`${api}/admin/prompts`, () => mockJson(adminPromptFixtures)),
  http.post(`${api}/admin/prompts`, async ({ request }) => {
    const input = (await request.json()) as { key?: string; template?: string };
    return mockJson(
      {
        ...adminPromptFixtures[0],
        id: "prompt-two",
        version: 4,
        key: input.key ?? "prescription-extraction",
        template: input.template ?? "Extract clinician-stated medications.",
      },
      { status: 201 },
    );
  }),
  http.get(`${api}/admin/audit`, ({ request }) => {
    const url = new URL(request.url);
    return mockJson(page(adminAuditFixtures, Number(url.searchParams.get("page") ?? 1)));
  }),
  http.get(`${api}/admin/health`, () => mockJson(adminHealthFixture)),
];
