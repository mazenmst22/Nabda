export type PulseLocale = "ar" | "en";
export type UnsafeClinicalCategory = "diagnosis" | "medication" | "severity";

const emergencySignals = [
  /\b(?:cannot|can't) breathe\b/iu,
  /\bdifficulty breathing\b/iu,
  /\bchest pain\b/iu,
  /\bsevere bleeding\b/iu,
  /\bunconscious\b/iu,
  /\b(?:suicide|suicidal)\b/iu,
  /\b(?:stroke|heart attack)\b/iu,
  /مش قادر أتنفس/iu,
  /مش قادرة أتنفس/iu,
  /صعوبة (?:في )?التنفس/iu,
  /ألم شديد في الصدر/iu,
  /نزيف شديد/iu,
  /فاقد الوعي/iu,
  /انتحار/iu,
  /جلطة/iu,
];

const humanIdentityQuestions = [
  /\b(?:are|am) (?:i )?(?:talking|speaking|chatting) (?:to|with) (?:a )?(?:human|person)\b/iu,
  /\bare you (?:a )?(?:human|person)\b/iu,
  /بكلم حد حقيقي/iu,
  /بتكلم مع إنسان/iu,
  /إنت بني آدم/iu,
  /انت انسان/iu,
];

const bookingIntents = [/\b(?:book|reserve|appointment)\b/iu, /احجز/iu, /حجز معاد/iu, /معاد مع/iu];

const unsafeMarkers: Array<{ category: UnsafeClinicalCategory; pattern: RegExp }> = [
  {
    category: "diagnosis",
    pattern:
      /(?:^|\n)\s*(?:diagnosis|التشخيص)\s*:|\b(?:you (?:have|likely have)|this is)\s+[a-z][a-z -]{2,}\b|عندك\s+[ء-ي]{3,}/iu,
  },
  {
    category: "medication",
    pattern:
      /(?:^|\n)\s*(?:medication recommendation|توصية دوائية)\s*:|\b(?:take|start|use)\s+(?:\d+\s*(?:mg|ml)|[A-Z][a-z]{3,})\b|خد\s+دوا/iu,
  },
  {
    category: "severity",
    pattern:
      /(?:^|\n)\s*(?:severity|درجة الخطورة)\s*:|\b(?:low|medium|moderate|high) risk\b|الحالة\s+(?:بسيطة|متوسطة|خطيرة)/iu,
  },
];

export function hasEmergencySignal(text: string) {
  return emergencySignals.some((signal) => signal.test(text));
}

export function asksIfHuman(text: string) {
  return humanIdentityQuestions.some((question) => question.test(text));
}

export function hasBookingIntent(text: string) {
  return bookingIntents.some((intent) => intent.test(text));
}

export function unsafeClinicalCategory(text: string): UnsafeClinicalCategory | null {
  return unsafeMarkers.find(({ pattern }) => pattern.test(text))?.category ?? null;
}

export function guardPulseResponse({
  text,
  locale,
  category = unsafeClinicalCategory(text),
}: {
  text: string;
  locale: PulseLocale;
  category?: UnsafeClinicalCategory | null;
}) {
  if (!category) return text;
  return locale === "ar"
    ? "Pulse مش بيعرض تشخيص أو توصية بدواء أو تقدير لخطورة الحالة. الطبيب هو اللي يقدر يقيّم الحالة ويشرح الخطوة الطبية المناسبة."
    : "Pulse cannot show a diagnosis, medication recommendation, or severity estimate. A clinician must assess the situation and explain the appropriate clinical next step.";
}
