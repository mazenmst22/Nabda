import { describe, expect, it } from "vitest";
import { formatDateTime, formatMoney, formatRelative } from "./formatters";
import { formatNumerals } from "./numeral-format";

const isolateStart = String.fromCodePoint(0x2066);
const isolateEnd = String.fromCodePoint(0x2069);
const nonBreakingSpace = String.fromCharCode(160);

describe("i18n formatters", () => {
  it("formats EGP in both locales and isolates the result as LTR", () => {
    expect(formatMoney({ amount: 450, currency: "EGP", locale: "en" })).toBe(
      `${isolateStart}EGP${nonBreakingSpace}450.00${isolateEnd}`,
    );
    expect(formatMoney({ amount: 450, currency: "EGP", locale: "ar" })).toBe(
      `${isolateStart}450.00${nonBreakingSpace}EGP${isolateEnd}`,
    );
  });

  it("always converts UTC timestamps in Africa/Cairo across the DST boundary", () => {
    const options = {
      locale: "en" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      hour12: false,
    };

    expect(formatDateTime("2024-04-25T21:30:00Z", options)).toBe("23:30");
    expect(formatDateTime("2024-04-25T22:30:00Z", options)).toBe("01:30");
  });

  it("substitutes Eastern Arabic numerals only through the numeral formatter", () => {
    expect(formatNumerals("20 · 09:30", { locale: "ar", preference: "eastern" })).toBe(
      "٢٠ · ٠٩:٣٠",
    );
    expect(formatNumerals("20 · 09:30", { locale: "ar" })).toBe("20 · 09:30");
  });

  it("formats relative time in the requested locale and numeral preference", () => {
    const target = "2026-08-28T16:30:00Z";
    const now = "2026-08-28T16:10:00Z";

    expect(formatRelative(target, { locale: "en", now })).toBe("in 20 minutes");
    expect(formatRelative(target, { locale: "ar", numerals: "eastern", now })).toBe(
      "خلال ٢٠ دقيقة",
    );
  });
});
