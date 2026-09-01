import { z } from "zod";
import { isoDateTimeSchema, pagedSchema } from "./common";

export const adminSettingsSchema = z
  .object({
    clinicId: z.string().min(1),
    locale: z.enum(["ar", "en"]),
    timezone: z.literal("Africa/Cairo"),
    retentionDays: z.number().int().min(1).max(365),
    version: z.number().int().positive(),
  })
  .strict();
export const adminProviderSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["stt", "llm"]),
    provider: z.string().min(1),
    model: z.string().min(1),
    region: z.string().min(1),
    timeoutMs: z.number().int().min(1000).max(120_000),
    confidenceThreshold: z.number().min(0).max(1),
    retentionDays: z.number().int().min(0).max(365),
    enabled: z.boolean(),
    version: z.number().int().positive(),
  })
  .strict();
export const adminFlagSchema = z
  .object({ key: z.string().min(1), enabled: z.boolean(), version: z.number().int().positive() })
  .strict();
export const adminPromptSchema = z
  .object({
    id: z.string().min(1),
    key: z.string().min(1),
    version: z.number().int().positive(),
    template: z.string().min(1),
    createdAt: isoDateTimeSchema,
    createdBy: z.string().min(1),
  })
  .strict();
export const adminAuditSchema = z
  .object({
    id: z.string().min(1),
    actor: z.string().min(1),
    action: z.string().min(1),
    entity: z.string().min(1),
    entityId: z.string().min(1),
    occurredAt: isoDateTimeSchema,
    correlationId: z.uuid(),
    reversible: z.boolean(),
  })
  .strict();
export const serviceHealthSchema = z.enum(["healthy", "degraded", "unavailable"]);
export const adminOperationalMetricsSchema = z
  .object({
    queueDepth: z.number().int().nonnegative(),
    jobLatencyMs: z
      .object({ p50: z.number().nonnegative(), p95: z.number().nonnegative() })
      .strict(),
    failureRate: z.number().min(0).max(1),
    sampledAt: isoDateTimeSchema,
  })
  .strict();
export const adminHealthSchema = z
  .object({
    api: serviceHealthSchema,
    db: serviceHealthSchema,
    queue: serviceHealthSchema,
    storage: serviceHealthSchema,
    providers: z.array(z.object({ id: z.string().min(1), status: serviceHealthSchema }).strict()),
    metrics: adminOperationalMetricsSchema,
  })
  .strict();
export const adminSchema = z
  .object({
    settings: adminSettingsSchema,
    providers: z.array(adminProviderSchema),
    flags: z.array(adminFlagSchema),
    prompts: z.array(adminPromptSchema),
  })
  .strict();
export const adminProviderListSchema = z.array(adminProviderSchema);
export const adminFlagListSchema = z.array(adminFlagSchema);
export const adminPromptListSchema = z.array(adminPromptSchema);
export const adminAuditListSchema = pagedSchema(adminAuditSchema);

export type Admin = z.infer<typeof adminSchema>;
export type AdminSettings = z.infer<typeof adminSettingsSchema>;
export type AdminProvider = z.infer<typeof adminProviderSchema>;
export type AdminFlag = z.infer<typeof adminFlagSchema>;
export type AdminPrompt = z.infer<typeof adminPromptSchema>;
export type AdminAudit = z.infer<typeof adminAuditSchema>;
export type AdminHealth = z.infer<typeof adminHealthSchema>;
export type AdminOperationalMetrics = z.infer<typeof adminOperationalMetricsSchema>;
