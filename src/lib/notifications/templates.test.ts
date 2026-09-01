import { describe, expect, it } from "vitest";
import {
  calculateSmsSegments,
  extractTemplateVariables,
  renderNotificationTemplate,
} from "./templates";

describe("SMS segmentation", () => {
  it("uses the UCS-2 single-message limit for Arabic", () => {
    expect(calculateSmsSegments("ا".repeat(70))).toMatchObject({
      characters: 70,
      segments: 1,
      perSegment: 70,
      encoding: "ucs-2",
    });
    expect(calculateSmsSegments("ا".repeat(71))).toMatchObject({
      characters: 71,
      segments: 2,
      perSegment: 67,
      encoding: "ucs-2",
    });
    expect(calculateSmsSegments("ا".repeat(134)).segments).toBe(2);
    expect(calculateSmsSegments("ا".repeat(135)).segments).toBe(3);
  });

  it("uses GSM-7 limits and counts extension characters as two septets", () => {
    expect(calculateSmsSegments("A".repeat(160))).toMatchObject({
      segments: 1,
      perSegment: 160,
      encoding: "gsm-7",
    });
    expect(calculateSmsSegments("A".repeat(161))).toMatchObject({
      segments: 2,
      perSegment: 153,
      encoding: "gsm-7",
    });
    expect(calculateSmsSegments("{".repeat(81)).segments).toBe(2);
  });
});

describe("notification template rendering", () => {
  it("substitutes known appointment variables and preserves unknown ones", () => {
    const values = {
      patient: "Amal",
      doctor: "Dr Mariam",
      clinic: "Nabda Clinic",
      date: "Saturday",
      time: "09:30",
      newDate: "Monday",
      newTime: "16:00",
      fee: "EGP 450",
      reference: "NBD-8F42K",
      address: "Maadi",
    };
    expect(renderNotificationTemplate("{patient} · {time} · {unknown}", values)).toBe(
      "Amal · 09:30 · {unknown}",
    );
    expect(extractTemplateVariables("{doctor} on {date} at {time}")).toEqual([
      "doctor",
      "date",
      "time",
    ]);
  });
});
