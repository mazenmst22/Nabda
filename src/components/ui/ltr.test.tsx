import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Ltr } from "./ltr";

describe("Ltr", () => {
  it("isolates a time inside Arabic content", () => {
    render(
      <p lang="ar" dir="rtl">
        المعاد <Ltr>09:30</Ltr>
      </p>,
    );
    expect(screen.getByText("09:30")).toHaveClass("ltr");
    expect(screen.getByText("09:30")).toHaveAttribute("dir", "ltr");
  });
});
