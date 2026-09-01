"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { DoctorCard, type DoctorCardLabels } from "@/components/search/doctor-card";
import { PulseOrb } from "@/components/pulse/pulse-orb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import { Sheet } from "@/components/ui/overlay";
import {
  localizedClinicDistrict,
  localizedSpecialty,
  localizedSubSpecialty,
  localizedTitle,
} from "@/lib/data/directory";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import type { Clinic, Doctor, Specialty } from "@/lib/schemas";

export type SearchLabels = DoctorCardLabels & {
  filters: string;
  sort: string;
  best: string;
  soonest: string;
  topRated: string;
  feeLow: string;
  feeHigh: string;
  specialty: string;
  subSpecialty: string;
  area: string;
  availability: string;
  any: string;
  today: string;
  tomorrow: string;
  gender: string;
  all: string;
  female: string;
  male: string;
  title: string;
  feeRange: string;
  feeMin: string;
  feeMax: string;
  onlinePayment: string;
  clear: string;
  apply: string;
  close: string;
  noResults: string;
  noResultsText: string;
  askPulse: string;
  resultSummary: string;
};

function cairoDate(iso: string) {
  return formatDateTime(iso, { locale: "en", year: "numeric", month: "2-digit", day: "2-digit" });
}

export function SearchResultsClient({
  locale,
  labels,
  doctors,
  clinics,
  specialties,
}: {
  locale: "ar" | "en";
  labels: SearchLabels;
  doctors: Doctor[];
  clinics: Clinic[];
  specialties: Specialty[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const formatNumerals = useNumerals();

  const value = (key: string, fallback = "") => searchParams.get(key) ?? fallback;
  const query = value("q").trim().toLocaleLowerCase();
  const specialty = value("specialty");
  const subSpecialty = value("subSpecialty");
  const district = value("district");
  const availability = value("availability", "any");
  const gender = value("gender");
  const title = value("title");
  const feeMin = Number(value("feeMin", "0"));
  const feeMax = Number(value("feeMax", "900"));
  const onlineOnly = value("onlinePayment") === "1";
  const sort = value("sort", "best");

  function update(key: string, nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!nextValue || nextValue === "all" || (key === "availability" && nextValue === "any"))
      params.delete(key);
    else params.set(key, nextValue);
    const queryString = params.toString();
    window.history.pushState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
  }

  function reset() {
    const queryValue = searchParams.get("q");
    window.history.pushState(
      null,
      "",
      queryValue ? `${pathname}?q=${encodeURIComponent(queryValue)}` : pathname,
    );
  }

  const clinicById = useMemo(
    () => new Map(clinics.map((clinic) => [clinic.id, clinic])),
    [clinics],
  );
  const subSpecialties = useMemo(
    () => [...new Set(doctors.flatMap((doctor) => doctor.subSpecialties))],
    [doctors],
  );
  const titles = useMemo(() => [...new Set(doctors.map((doctor) => doctor.title))], [doctors]);

  const results = useMemo(() => {
    const today = cairoDate(new Date().toISOString());
    const tomorrow = cairoDate(new Date(Date.now() + 86_400_000).toISOString());
    const filtered = doctors.filter((doctor) => {
      const clinic = clinicById.get(doctor.clinicId);
      if (!clinic) return false;
      const haystack = [
        doctor.nameAr,
        doctor.nameEn,
        localizedTitle(doctor.title, locale),
        ...doctor.specialties.map((item) => localizedSpecialty(item, locale)),
        ...doctor.subSpecialties.map((item) => localizedSubSpecialty(item, locale)),
        localizedClinicDistrict(clinic, locale),
      ]
        .join(" ")
        .toLocaleLowerCase();
      const nextDate = doctor.nextAvailable ? cairoDate(doctor.nextAvailable) : "";
      return (
        (!query || haystack.includes(query)) &&
        (!specialty || doctor.specialties.includes(specialty)) &&
        (!subSpecialty || doctor.subSpecialties.includes(subSpecialty)) &&
        (!district || clinic.district === district) &&
        (availability === "any" ||
          (availability === "today" ? nextDate === today : nextDate === tomorrow)) &&
        (!gender || doctor.gender === gender) &&
        (!title || doctor.title === title) &&
        doctor.fee.amount >= feeMin &&
        doctor.fee.amount <= feeMax &&
        (!onlineOnly || doctor.acceptsOnlinePayment)
      );
    });
    return [...filtered].sort((a, b) => {
      if (sort === "soonest") return (a.nextAvailable ?? "").localeCompare(b.nextAvailable ?? "");
      if (sort === "rating") return b.rating.average - a.rating.average;
      if (sort === "feeAsc") return a.fee.amount - b.fee.amount;
      if (sort === "feeDesc") return b.fee.amount - a.fee.amount;
      return (
        Number(Boolean(b.nextAvailable)) - Number(Boolean(a.nextAvailable)) ||
        b.rating.average - a.rating.average
      );
    });
  }, [
    availability,
    clinicById,
    district,
    doctors,
    feeMax,
    feeMin,
    gender,
    locale,
    onlineOnly,
    query,
    sort,
    specialty,
    subSpecialty,
    title,
  ]);

  function Filters({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="filter-content">
        <div className="filter-heading">
          <h2>{labels.filters}</h2>
          <button type="button" onClick={reset}>
            {labels.clear}
          </button>
        </div>

        <label className="filter-field">
          <span>{labels.specialty}</span>
          <select value={specialty} onChange={(event) => update("specialty", event.target.value)}>
            <option value="">{labels.all}</option>
            {specialties.map((item) => (
              <option value={item.key} key={item.key}>
                {locale === "ar" ? item.nameAr : item.nameEn}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>{labels.subSpecialty}</span>
          <select
            value={subSpecialty}
            onChange={(event) => update("subSpecialty", event.target.value)}
          >
            <option value="">{labels.all}</option>
            {subSpecialties.map((item) => (
              <option value={item} key={item}>
                {localizedSubSpecialty(item, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>{labels.area}</span>
          <select value={district} onChange={(event) => update("district", event.target.value)}>
            <option value="">{labels.all}</option>
            {clinics.map((clinic) => (
              <option value={clinic.district} key={clinic.id}>
                {localizedClinicDistrict(clinic, locale)}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>{labels.availability}</legend>
          <div className="segmented">
            {["any", "today", "tomorrow"].map((option) => (
              <button
                key={option}
                type="button"
                className={availability === option ? "selected" : ""}
                onClick={() => update("availability", option)}
              >
                {labels[option as "any" | "today" | "tomorrow"]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{labels.feeRange}</legend>
          <div className="fee-filter-grid">
            <label>
              <span>{labels.feeMin}</span>
              <input
                type="number"
                min="0"
                max="900"
                step="50"
                value={feeMin}
                onChange={(event) => update("feeMin", event.target.value)}
              />
            </label>
            <label>
              <span>{labels.feeMax}</span>
              <input
                type="number"
                min="250"
                max="900"
                step="50"
                value={feeMax}
                onChange={(event) => update("feeMax", event.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <label className="filter-field">
          <span>{labels.gender}</span>
          <select value={gender} onChange={(event) => update("gender", event.target.value)}>
            <option value="">{labels.all}</option>
            <option value="female">{labels.female}</option>
            <option value="male">{labels.male}</option>
          </select>
        </label>

        <label className="filter-field">
          <span>{labels.title}</span>
          <select value={title} onChange={(event) => update("title", event.target.value)}>
            <option value="">{labels.all}</option>
            {titles.map((item) => (
              <option value={item} key={item}>
                {localizedTitle(item, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(event) => update("onlinePayment", event.target.checked ? "1" : "")}
          />
          <span>{labels.onlinePayment}</span>
        </label>

        {mobile ? (
          <Button className="apply-filters" onClick={() => setMobileFilters(false)}>
            {labels.apply}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="results-layout">
      <aside className="filter-sidebar">
        <Filters />
      </aside>
      <div className="results-column">
        <div className="results-toolbar">
          <button
            type="button"
            className="mobile-filter-button"
            onClick={() => setMobileFilters(true)}
          >
            <Icon name="filter" size={18} />
            {labels.filters}
          </button>
          <span className="result-summary" role="status">
            <b>
              <Ltr>{formatNumerals(results.length)}</Ltr>
            </b>{" "}
            {labels.resultSummary}
          </span>
          <label>
            {labels.sort}
            <select value={sort} onChange={(event) => update("sort", event.target.value)}>
              <option value="best">{labels.best}</option>
              <option value="rating">{labels.topRated}</option>
              <option value="feeAsc">{labels.feeLow}</option>
              <option value="feeDesc">{labels.feeHigh}</option>
              <option value="soonest">{labels.soonest}</option>
            </select>
          </label>
        </div>
        <div className="results-grid">
          {results.map((doctor) => {
            const clinic = clinicById.get(doctor.clinicId);
            return clinic ? (
              <DoctorCard
                doctor={doctor}
                clinic={clinic}
                locale={locale}
                labels={labels}
                headingLevel={2}
                key={doctor.id}
              />
            ) : null;
          })}
        </div>
        {results.length === 0 ? (
          <div className="empty-results">
            <PulseOrb />
            <h2>{labels.noResults}</h2>
            <p>{labels.noResultsText}</p>
            <Link className="ui-button ui-button--pulse" href={`/${locale}/pulse`}>
              <Icon name="spark" size={18} />
              <span>{labels.askPulse}</span>
            </Link>
          </div>
        ) : null}
      </div>
      <Sheet
        open={mobileFilters}
        onOpenChange={setMobileFilters}
        title={labels.filters}
        closeLabel={labels.close}
      >
        <Filters mobile />
      </Sheet>
    </div>
  );
}
