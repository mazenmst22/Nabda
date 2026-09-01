import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const variants = [
  { locale: "ar", direction: "rtl", theme: "light" },
  { locale: "ar", direction: "rtl", theme: "dark" },
  { locale: "en", direction: "ltr", theme: "light" },
  { locale: "en", direction: "ltr", theme: "dark" },
] as const;

for (const variant of variants) {
  test(`${variant.locale} ${variant.theme} gallery passes axe`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("nabda-theme", theme), variant.theme);
    await page.goto(`/${variant.locale}/dev/ui`);

    await expect(page.locator("html")).toHaveAttribute("dir", variant.direction);
    await expect(page.locator("html")).toHaveAttribute("data-theme", variant.theme);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("keyboard traversal reaches every visible control in DOM order", async ({ page }) => {
  await page.goto("/en/dev/ui");
  const sequence = await page.locator("body").evaluate(() => {
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex='0']",
    ].join(",");
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (element) => {
        const style = getComputedStyle(element);
        return (
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0 &&
          style.visibility !== "hidden"
        );
      },
    );
    elements.forEach((element, index) => element.setAttribute("data-tab-sequence", String(index)));
    return elements.map((_, index) => String(index));
  });

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const expected of sequence) {
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("data-tab-sequence", expected);
  }
});

test("combobox, tabs, calendar, and dialog work from the keyboard", async ({ page }) => {
  await page.goto("/en/dev/ui");

  const combobox = page.getByRole("combobox", { name: "Find a doctor" });
  await combobox.focus();
  await combobox.fill("Mariam");
  await expect(page.getByRole("option", { name: /Dr Mariam Fouad/u })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(combobox).toHaveValue("Dr Mariam Fouad");

  const upcomingTab = page.getByRole("tab", { name: "Upcoming" });
  await upcomingTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Past" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("Completed appointments");

  await page.getByRole("button", { name: /August/u }).click();
  await expect(page.getByRole("dialog", { name: "Appointment calendar" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Appointment calendar" })).toBeHidden();

  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Appointment details" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("interactive gallery layers pass axe when opened", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nabda-theme", "dark"));
  await page.goto("/en/dev/ui");

  const assertAxe = async () => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  };

  const combobox = page.getByRole("combobox", { name: "Find a doctor" });
  await combobox.focus();
  await expect(page.getByRole("listbox", { name: "Find a doctor" })).toBeVisible();
  await assertAxe();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /August/u }).click();
  await assertAxe();
  await page.keyboard.press("Escape");

  for (const name of ["Open dialog", "Open schedule sheet", "Open confirmation"]) {
    await page.getByRole("button", { name }).click();
    await assertAxe();
    await page.keyboard.press("Escape");
  }
});
