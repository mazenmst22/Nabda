import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingSignIn } from "@/components/booking/booking-sign-in";

function safeReturnTo(value: string | string[] | undefined, locale: "ar" | "en") {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith(`/${locale}/`) ? candidate : `/${locale}`;
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("booking.flow");
  return (
    <BookingSignIn
      returnTo={safeReturnTo(query.returnTo, locale)}
      labels={{
        secure: t("secureSignIn"),
        title: t("signInTitle"),
        text: t("signInText"),
        patient: t("patientAccount"),
        action: t("signInContinue"),
      }}
    />
  );
}
