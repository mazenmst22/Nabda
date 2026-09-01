"use client";

import { useTranslations } from "next-intl";
import { useNumerals } from "@/lib/i18n/numerals";

type DomainNamespace = "common" | "booking" | "pulse" | "clinical" | "admin";
type PluralValue = string | number | Date;

export function Plural({
  namespace,
  id,
  count,
  values = {},
}: {
  namespace: DomainNamespace;
  id: string;
  count: number;
  values?: Record<string, PluralValue>;
}) {
  const translate = useTranslations(namespace);
  const formatNumerals = useNumerals();
  const translatePlural = translate as unknown as (
    key: string,
    interpolationValues: Record<string, PluralValue>,
  ) => string;

  return <>{translatePlural(id, { ...values, count, formattedCount: formatNumerals(count) })}</>;
}
