import { describe, expect, it } from "vitest";
import { adminProviderSchema, adminSettingsSchema } from "./admin";

const provider = {
  id: "provider-stt",
  kind: "stt" as const,
  provider: "mock-stt",
  model: "arabic-medical",
  region: "egypt",
  timeoutMs: 30_000,
  confidenceThreshold: 0.85,
  retentionDays: 30,
  enabled: true,
  version: 1,
};

describe("developer configuration validation", () => {
  it("accepts supported provider settings", () => {
    expect(adminProviderSchema.safeParse(provider).success).toBe(true);
  });

  it.each([
    { timeoutMs: 999 },
    { timeoutMs: 120_001 },
    { confidenceThreshold: -0.01 },
    { confidenceThreshold: 1.01 },
    { retentionDays: 366 },
  ])("rejects unsafe provider bounds: %o", (override) => {
    expect(adminProviderSchema.safeParse({ ...provider, ...override }).success).toBe(false);
  });

  it("rejects tenant retention outside policy", () => {
    expect(
      adminSettingsSchema.safeParse({
        clinicId: "clinic-maadi",
        locale: "ar",
        timezone: "Africa/Cairo",
        retentionDays: 366,
        version: 1,
      }).success,
    ).toBe(false);
  });
});
