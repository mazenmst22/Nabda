import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchForm } from "@/components/search/search-form";
import { DoctorCard } from "@/components/search/doctor-card";
import { PulseOrb } from "@/components/pulse/pulse-orb";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import {
  clinicForDoctor,
  directorySpecialties,
  getDirectoryDoctors,
  localizedClinicDistrict,
  localizedSpecialty,
  specialtyIcons,
} from "@/lib/data/directory";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import { localizedAlternates, openGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const home = await getTranslations({ locale, namespace: "home" });
  return {
    title: home("metadataTitle"),
    description: home("metadataDescription"),
    alternates: localizedAlternates(locale),
    openGraph: openGraph(locale, home("metadataTitle"), home("metadataDescription")),
  };
}

export const revalidate = 30;

export default async function HomePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const common = await getTranslations("common");
  const home = await getTranslations("home");
  const search = await getTranslations("searchPage");
  const arabic = locale === "ar";
  const directoryDoctors = getDirectoryDoctors();
  const featuredDoctor = directoryDoctors[0];
  if (!featuredDoctor) return null;
  const featuredClinic = clinicForDoctor(featuredDoctor);
  if (!featuredClinic || !featuredDoctor.nextAvailable) return null;
  const featuredTime = formatDateTime(featuredDoctor.nextAvailable, {
    locale,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const doctorLabels = {
    available: common("available"),
    fee: common("fee"),
    reviews: common("reviews"),
    nextAvailable: common("nextAvailable"),
    today: search("today"),
    tomorrow: search("tomorrow"),
    slotPrefix: search("slotPrefix"),
  };

  return (
    <main>
      <section className="hero-section">
        <div className="hero-grid shell">
          <div className="hero-copy">
            <div className="eyebrow">
              <Icon name="shield" size={16} />
              {home("eyebrow")}
            </div>
            <h1 className="type-display">{home("title")}</h1>
            <p className="hero-subtitle">{home("subtitle")}</p>
            <SearchForm
              locale={locale}
              placeholder={common("search")}
              action={common("searchAction")}
              hint={home("searchHint")}
            />
            <div className="today-proof">
              <span className="live-pip" />
              <strong>
                <Ltr>{formatNumerals(342, { locale })}</Ltr>
              </strong>{" "}
              {home("todayProof")}
            </div>
          </div>

          <div className="hero-proof" aria-label={home("liveLabel")}>
            <div className="proof-caption">
              <span className="live-pip" />
              {home("liveLabel")}
              <Ltr>{formatNumerals("08:42:16", { locale })}</Ltr>
            </div>
            <div className="hero-doctor-card">
              <div className="hero-card-top">
                <div className="doctor-avatar hero-avatar">
                  <span>{arabic ? "م ف" : "MF"}</span>
                </div>
                <div>
                  <span className="mini-specialty">
                    {localizedSpecialty(featuredDoctor.specialties[0] ?? "", locale)}
                  </span>
                  <h2>{arabic ? featuredDoctor.nameAr : featuredDoctor.nameEn}</h2>
                  <p>
                    {localizedClinicDistrict(featuredClinic, locale)} ·{" "}
                    <Icon name="star" size={14} />
                    <Ltr>
                      {formatNumerals(featuredDoctor.rating.average.toFixed(1), { locale })}
                    </Ltr>
                  </p>
                </div>
              </div>
              <div className="hero-slot-label">
                <span>{home("liveLabel")}</span>
                <small>{common("fee")}</small>
              </div>
              <div className="hero-slot-row">
                <span className="hero-slot selected">
                  <Ltr>{formatNumerals(featuredTime, { locale })}</Ltr>
                  <small>{search("today")}</small>
                </span>
                <span className="hero-slot">
                  <Ltr>
                    {formatNumerals(
                      formatDateTime(
                        new Date(
                          new Date(featuredDoctor.nextAvailable).getTime() + 30 * 60 * 1000,
                        ).toISOString(),
                        { locale, hour: "2-digit", minute: "2-digit", hour12: false },
                      ),
                      { locale },
                    )}
                  </Ltr>
                  <small>{search("today")}</small>
                </span>
                <strong>
                  <Ltr>{formatMoney({ ...featuredDoctor.fee, locale })}</Ltr>
                </strong>
              </div>
              <Link
                prefetch={false}
                href={`/${locale}/doctor/${featuredDoctor.slug}`}
                className="hero-book-button"
              >
                <Icon name="calendar" size={18} />
                {search("slotPrefix")} <Ltr>{formatNumerals(featuredTime, { locale })}</Ltr>
              </Link>
            </div>
            <div className="certainty-card">
              <Icon name="check" size={17} />
              <span>{common("confirmed")}</span>
              <small>{home("freePay")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="specialties-section shell" id="specialties">
        <div className="section-heading">
          <div>
            <span className="section-index">01</span>
            <h2 className="type-h1">{home("specialtyHeading")}</h2>
            <p>{home("specialtySubtitle")}</p>
          </div>
          <Link prefetch={false} href={`/${locale}/search`}>
            {common("viewAll")}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="specialty-grid">
          {directorySpecialties.map((specialty) => (
            <Link
              prefetch={false}
              key={specialty.key}
              href={`/${locale}/search?specialty=${specialty.key}`}
              className="specialty-tile"
            >
              <span className="specialty-icon">
                <Icon name={specialtyIcons[specialty.key] ?? "plus"} />
              </span>
              <strong>{arabic ? specialty.nameAr : specialty.nameEn}</strong>
              <Icon name="arrow" size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="section-index">02</span>
              <h2 className="type-h1">{home("featuredHeading")}</h2>
              <p>
                {home("featuredSubtitle")}{" "}
                <button className="ranking-note" type="button">
                  {home("rankingNote")}
                </button>
              </p>
            </div>
            <Link prefetch={false} href={`/${locale}/search`}>
              {common("viewAll")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="featured-grid">
            {directoryDoctors.slice(0, 3).map((doctor) => {
              const clinic = clinicForDoctor(doctor);
              return clinic ? (
                <DoctorCard
                  doctor={doctor}
                  clinic={clinic}
                  locale={locale}
                  labels={doctorLabels}
                  compact
                  key={doctor.id}
                />
              ) : null;
            })}
          </div>
        </div>
      </section>

      <section className="pulse-band">
        <div className="shell pulse-grid">
          <div className="pulse-copy">
            <div className="pulse-kicker">
              <PulseOrb size="small" />
              {home("pulseKicker")}
            </div>
            <h2>{home("pulseTitle")}</h2>
            <p>{home("pulseText")}</p>
            <Link prefetch={false} href={`/${locale}/pulse`} className="pulse-button">
              {home("askPulse")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="pulse-demo">
            <div className="chat-label">
              <PulseOrb size="small" />
              <span>Pulse</span>
              <i />
            </div>
            <div className="chat-bubble user-bubble">{home("pulsePrompt")}</div>
            <div className="chat-bubble pulse-bubble">
              <PulseOrb size="small" />
              <p>
                {home.rich("pulseReply", {
                  time: formatNumerals(featuredTime, { locale }),
                  price: formatMoney({
                    ...featuredDoctor.fee,
                    locale,
                  }),
                  timeTag: (chunks) => <Ltr>{chunks}</Ltr>,
                  priceTag: (chunks) => <Ltr>{chunks}</Ltr>,
                })}
              </p>
              <button type="button">
                {search("slotPrefix")} <Ltr>{formatNumerals(featuredTime, { locale })}</Ltr>
              </button>
            </div>
            <div className="pulse-safe-note">
              <Icon name="shield" size={15} />
              {home("freePay")}
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section shell">
        <div className="trust-stat">
          <strong>
            <Ltr>{formatNumerals(128, { locale })}</Ltr>
          </strong>
          <span>{home("trustOne")}</span>
        </div>
        <div className="trust-stat">
          <strong>
            <Ltr>{formatNumerals("4,180+", { locale })}</Ltr>
          </strong>
          <span>{home("trustTwo")}</span>
        </div>
        <div className="trust-stat">
          <strong>
            <Ltr>{formatNumerals("4.8 / 5", { locale })}</Ltr>
          </strong>
          <span>{home("trustThree")}</span>
        </div>
      </section>

      <section className="clinic-band" id="for-clinics">
        <div className="shell clinic-grid">
          <div>
            <span>{home("clinicKicker")}</span>
            <h2>{home("clinicTitle")}</h2>
            <p>{home("clinicText")}</p>
            <Link prefetch={false} href={`/${locale}/for-clinics`}>
              {home("clinicAction")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="clinic-dashboard" aria-hidden="true">
            <div className="dash-header">
              <i />
              <i />
              <i />
            </div>
            <div className="dash-stat-row">
              <b />
              <b />
              <b />
            </div>
            <div className="dash-schedule">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
