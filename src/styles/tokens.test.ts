import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");
const allowedExtensions = new Set([".css", ".ts", ".tsx"]);
const hexPattern = /#[\da-f]{3,8}\b/iu;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return allowedExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("design token guardrails", () => {
  it("keeps hardcoded hexadecimal colours in tokens.css", () => {
    const violations = sourceFiles(sourceRoot)
      .filter((path) => !path.endsWith(join("styles", "tokens.css")))
      .filter((path) => hexPattern.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  it("declares every dark override in the bare root token set", () => {
    const css = readFileSync(join(sourceRoot, "styles", "tokens.css"), "utf8");
    const bareRoot = css.match(/:root\s*\{([\s\S]*?)\n\}/u)?.[1] ?? "";
    const conditionalCss = css.slice(css.indexOf("@media"), css.indexOf("@theme"));
    const conditionalNames = [...conditionalCss.matchAll(/(--[\w-]+)\s*:/gu)].map(
      (match) => match[1],
    );

    expect(conditionalNames.length).toBeGreaterThan(0);
    expect(conditionalNames.every((name) => name && bareRoot.includes(`${name}:`))).toBe(true);
  });
});
