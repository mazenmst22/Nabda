import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it } from "vitest";
import { setNumeralPreference, useNumerals } from "./numerals";

function NumeralProbe() {
  const formatNumerals = useNumerals();
  return <output>{formatNumerals("20 · 09:30")}</output>;
}

describe("useNumerals", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to Western numerals", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <NumeralProbe />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("20 · 09:30")).toBeInTheDocument();
  });

  it("honours the stored Eastern Arabic preference", () => {
    window.localStorage.setItem("nabda-numerals", "eastern");
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <NumeralProbe />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("٢٠ · ٠٩:٣٠")).toBeInTheDocument();
  });

  it("updates mounted formatters immediately when the preference changes", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <NumeralProbe />
      </NextIntlClientProvider>,
    );

    act(() => setNumeralPreference("eastern"));

    expect(screen.getByText("٢٠ · ٠٩:٣٠")).toBeInTheDocument();
  });
});
