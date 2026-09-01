import { describe, expect, it } from "vitest";
import { asksIfHuman, guardPulseResponse, hasBookingIntent, hasEmergencySignal } from "./safety";

describe("Pulse UI safety boundary", () => {
  it("detects emergency, human-identity, and booking intents in both languages", () => {
    expect(hasEmergencySignal("I have severe chest pain")).toBe(true);
    expect(hasEmergencySignal("عندي ألم شديد في الصدر")).toBe(true);
    expect(asksIfHuman("Are you a human?")).toBe(true);
    expect(asksIfHuman("إنت بني آدم؟")).toBe(true);
    expect(hasBookingIntent("Book an appointment")).toBe(true);
    expect(hasBookingIntent("محتاج أحجز معاد")).toBe(true);
  });

  it("replaces unsafe clinical output with the refusal template", () => {
    expect(guardPulseResponse({ text: "Diagnosis: migraine", locale: "en" })).not.toContain(
      "migraine",
    );
    expect(guardPulseResponse({ text: "توصية دوائية: aspirin", locale: "ar" })).not.toContain(
      "aspirin",
    );
  });
});
