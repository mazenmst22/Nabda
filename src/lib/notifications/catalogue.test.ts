import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";
import { notificationPreviewData } from "./preview-data";
import {
  calculateSmsSegments,
  extractTemplateVariables,
  notificationChannels,
  notificationEvents,
  notificationLocales,
  notificationVariables,
  renderNotificationTemplate,
  type NotificationTemplateCatalogue,
} from "./templates";

const catalogues = {
  ar: arMessages.admin.notifications.templates,
  en: enMessages.admin.notifications.templates,
} as NotificationTemplateCatalogue;
const allowedVariables = new Set<string>(notificationVariables);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/u.test(entry.name) ? [path] : [];
  });
}

describe("notification catalogue", () => {
  it("renders every event, language, and channel with real appointment data", () => {
    let rendered = 0;
    for (const locale of notificationLocales) {
      for (const event of notificationEvents) {
        for (const channel of notificationChannels) {
          const template = catalogues[locale][event][channel];
          const variables = [
            ...extractTemplateVariables(template.body),
            ...extractTemplateVariables(template.subject ?? ""),
          ];
          expect(variables.every((variable) => allowedVariables.has(variable))).toBe(true);
          expect(
            renderNotificationTemplate(template.body, notificationPreviewData[locale]),
          ).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/u);
          if (channel === "email") expect(template.subject).toBeTruthy();
          if (channel === "sms" && locale === "ar") {
            expect(
              calculateSmsSegments(
                renderNotificationTemplate(template.body, notificationPreviewData.ar),
              ).encoding,
            ).toBe("ucs-2");
          }
          rendered += 1;
        }
      }
    }
    expect(rendered).toBe(36);
  });

  it("keeps complete template strings in the message catalogues only", () => {
    const source = sourceFiles(join(process.cwd(), "src"))
      .filter((path) => !path.endsWith("catalogue.test.ts"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    for (const locale of notificationLocales) {
      for (const event of notificationEvents) {
        for (const channel of notificationChannels) {
          const template = catalogues[locale][event][channel];
          expect(source).not.toContain(template.body);
          if (template.subject) expect(source).not.toContain(template.subject);
        }
      }
    }
  });
});
