import { NextResponse } from "next/server";

export function bookingError(
  request: Request,
  code: "SLOT_TAKEN" | "HOLD_EXPIRED" | "PROVIDER_UNAVAILABLE",
  status: number,
) {
  const arabic = request.headers.get("Accept-Language") === "ar";
  const detail = {
    SLOT_TAKEN: {
      ar: "المعاد ده اتحجز من مريض تاني. اختار من البدائل المتاحة.",
      en: "Another patient booked that slot. Choose one of the available alternatives.",
    },
    HOLD_EXPIRED: {
      ar: "وقت حجز المعاد المؤقت خلص. المعاد اللي اخترته لسه محفوظ علشان تحاول تاني.",
      en: "The temporary hold expired. Your selected time is preserved so you can try again.",
    },
    PROVIDER_UNAVAILABLE: {
      ar: "تعذر تسجيل الحجز دلوقتي. هنحاول بنفس رقم الطلب من غير ما نكرر الحجز.",
      en: "The booking could not be recorded yet. We will retry with the same request reference.",
    },
  }[code][arabic ? "ar" : "en"];

  return NextResponse.json(
    {
      type: `https://nabda.health/errors/${code.toLowerCase().replaceAll("_", "-")}`,
      title: detail,
      status,
      code,
      detail,
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status },
  );
}
