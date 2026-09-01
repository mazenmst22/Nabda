import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it } from "vitest";
import arMessages from "../../../messages/ar.json";
import { Plural } from "./plural";

const cases = [
  [0, "مفيش مواعيد"],
  [1, "ميعاد واحد"],
  [2, "ميعادين"],
  [3, "عند حضرتك 3 مواعيد"],
  [11, "عند حضرتك 11 ميعاد"],
  [100, "إجمالي المواعيد 100"],
] as const;

describe("Plural", () => {
  beforeEach(() => window.localStorage.clear());

  it.each(cases)("selects the Arabic plural form for %i", (count, expected) => {
    render(
      <NextIntlClientProvider locale="ar" messages={{ booking: arMessages.booking }}>
        <Plural namespace="booking" id="appointmentCount" count={count} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
