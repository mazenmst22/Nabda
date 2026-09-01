import { describe, expect, it } from "vitest";
import { createMockSession } from "@/lib/auth/session";
import { can } from "./permissions";
import { nonDisclosingForbidden } from "./http";

describe("clinical record route boundary", () => {
  it("denies developer reads before resource lookup", async () => {
    const developer = createMockSession("developer");
    expect(can(developer, "clinical_record", "read", { clinicId: "clinic-maadi" })).toBe(false);

    const existingResourceDenial = nonDisclosingForbidden();
    const unknownResourceDenial = nonDisclosingForbidden();
    expect(existingResourceDenial.status).toBe(403);
    expect(await existingResourceDenial.json()).toEqual({
      code: "NOT_AUTHORIZED",
      detail: "Access denied",
    });
    expect(await unknownResourceDenial.json()).toEqual({
      code: "NOT_AUTHORIZED",
      detail: "Access denied",
    });
  });
});
