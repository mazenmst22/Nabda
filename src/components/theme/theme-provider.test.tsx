import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <output>{`${theme}:${resolvedTheme}`}</output>
      <button type="button" onClick={() => setTheme("light")}>
        light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        system
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-preference");
    document.documentElement.removeAttribute("data-resolved-theme");
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("restores, applies, and persists all three preference states", async () => {
    window.localStorage.setItem("nabda-theme", "dark");
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("dark:dark")).toBeInTheDocument());
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    act(() => screen.getByRole("button", { name: "light" }).click());
    expect(window.localStorage.getItem("nabda-theme")).toBe("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    act(() => screen.getByRole("button", { name: "system" }).click());
    expect(window.localStorage.getItem("nabda-theme")).toBe("system");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(screen.getByText("system:dark")).toBeInTheDocument();
  });
});
