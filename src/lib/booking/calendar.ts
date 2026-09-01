type CalendarAppointment = {
  id: string;
  start: string;
  end: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
};

function escapeText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function utcStamp(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

export function createAppointmentCalendar(appointment: CalendarAppointment) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nabda//Appointment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(appointment.id)}@nabda.health`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(appointment.start)}`,
    `DTEND:${utcStamp(appointment.end)}`,
    `SUMMARY:${escapeText(`Appointment with ${appointment.doctorName}`)}`,
    `LOCATION:${escapeText(`${appointment.clinicName}, ${appointment.clinicAddress}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
