import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import type { NotificationPreviewData } from "./templates";

const appointmentStart = "2026-09-05T07:30:00Z";
const rescheduledStart = "2026-09-07T14:00:00Z";

function values(locale: "ar" | "en") {
  return {
    patient: locale === "ar" ? "أمل حسن" : "Amal Hassan",
    doctor: locale === "ar" ? "د. مريم فؤاد" : "Dr Mariam Fouad",
    clinic: locale === "ar" ? "عيادات نبضة المعادي" : "Nabda Maadi Clinic",
    date: formatDateTime(appointmentStart, { locale, dateStyle: "full" }),
    time: formatDateTime(appointmentStart, { locale, timeStyle: "short" }),
    newDate: formatDateTime(rescheduledStart, { locale, dateStyle: "full" }),
    newTime: formatDateTime(rescheduledStart, { locale, timeStyle: "short" }),
    fee: formatMoney({ amount: 450, currency: "EGP", locale }),
    reference: "NBD-8F42K",
    address:
      locale === "ar" ? "شارع النصر، المعادي الجديدة، القاهرة" : "Al Nasr Street, New Maadi, Cairo",
  };
}

export const notificationPreviewData: NotificationPreviewData = {
  ar: values("ar"),
  en: values("en"),
};
