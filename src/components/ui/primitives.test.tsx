import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/content";
import { TimeSlotChip } from "@/components/ui/time-slot-chip";

describe("UI primitives", () => {
  it("exposes the loading button state without losing its label", () => {
    render(
      <Button loading loadingLabel="Saving">
        Confirm
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders status as a label plus a distinct icon", () => {
    const { container } = render(<StatusPill status="held" label="Held" />);

    expect(screen.getByText("Held")).toBeInTheDocument();
    expect(container.querySelector("[data-status='held'] svg")).toBeInTheDocument();
  });

  it("marks an unavailable time with text and a disabled control", () => {
    render(<TimeSlotChip time="09:30" state="unavailable" unavailableLabel="Unavailable" />);

    expect(screen.getByRole("button", { name: "09:30, Unavailable" })).toBeDisabled();
  });
});
