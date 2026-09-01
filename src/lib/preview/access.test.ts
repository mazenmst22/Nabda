import { describe, expect, it, vi } from "vitest";
import { isPreviewEnabled, requirePreviewEnabled } from "./access";

describe("preview route production guard", () => {
  it("returns notFound when the preview flag is off", () => {
    const notFound = vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    expect(() => requirePreviewEnabled("development", undefined, notFound)).toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("cannot be enabled in a production build", () => {
    expect(isPreviewEnabled("production", "1")).toBe(false);
    expect(isPreviewEnabled("development", "1")).toBe(true);
  });
});
