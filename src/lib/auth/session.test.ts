import { describe, expect, it } from "vitest";
import {
  createMockSession,
  decodeSessionToken,
  encodeSessionToken,
  hasFreshStepUp,
  renewSession,
  stepUpSession,
} from "./session";

describe("mock OIDC-shaped sessions", () => {
  it("round-trips through the provider token seam", () => {
    const session = createMockSession("doctor", { exp: 2_000_000_000 });
    expect(decodeSessionToken(encodeSessionToken(session))).toEqual(session);
  });

  it("renews only an active session and clears previous step-up state", () => {
    const active = createMockSession("clinic_admin", { exp: 110, stepUpExp: 105 });
    expect(renewSession(active, 100)).toMatchObject({ exp: 3700, stepUpExp: undefined });
    expect(renewSession({ ...active, exp: 99 }, 100)).toBeNull();
  });

  it("issues a short-lived fresh-auth proof", () => {
    const active = createMockSession("clinic_admin", { exp: 1000 });
    const verified = stepUpSession(active, 100);
    expect(verified && hasFreshStepUp(verified, 101)).toBe(true);
    expect(verified && hasFreshStepUp(verified, 401)).toBe(false);
  });
});
