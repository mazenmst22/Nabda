import { describe, expect, it } from "vitest";
import { createAppointmentCalendar } from "./calendar";

describe("createAppointmentCalendar", () => {
  it("creates a UTC calendar event with escaped clinic details", () => {
    const calendar = createAppointmentCalendar({
      id: "appointment-one",
      start: "2026-08-29T09:30:00Z",
      end: "2026-08-29T10:00:00Z",
      doctorName: "Dr Mariam Fouad",
      clinicName: "Nabda; Maadi",
      clinicAddress: "Street 1, Cairo",
    });
    expect(calendar).toContain("DTSTART:20260829T093000Z");
    expect(calendar).toContain("LOCATION:Nabda\\; Maadi\\, Street 1\\, Cairo");
    expect(calendar).toContain("TRIGGER:-PT2H");
  });
});
