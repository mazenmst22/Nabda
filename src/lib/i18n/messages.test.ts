import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("message numeral guardrail", () => {
  it.each(["ar", "en"])(
    "keeps %s numerals as formatter values, never message literals",
    (locale) => {
      const messages: unknown = JSON.parse(
        readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8"),
      );

      function collectStrings(value: unknown): string[] {
        if (typeof value === "string") return [value];
        if (Array.isArray(value)) return value.flatMap(collectStrings);
        if (value && typeof value === "object") {
          return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
        }
        return [];
      }

      expect(collectStrings(messages).join("\n")).not.toMatch(/[0-9٠-٩]/u);
    },
  );
});
