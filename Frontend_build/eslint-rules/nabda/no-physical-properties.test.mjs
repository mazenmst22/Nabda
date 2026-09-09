import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import nabdaPlugin from "./index.mjs";

const fixturePath = path.resolve("eslint-rules/nabda/fixtures/physical-class.js");
const cssFixturePath = path.resolve("eslint-rules/nabda/fixtures/physical-properties.css");
const ruleConfig = [
  {
    plugins: { nabda: nabdaPlugin },
    rules: { "nabda/no-physical-properties": "error" },
  },
];

describe("nabda/no-physical-properties", () => {
  it("fails on the ml-4 proof fixture", () => {
    const source = readFileSync(fixturePath, "utf8");
    const messages = new Linter().verify(source, ruleConfig, {
      filename: "physical-class.js",
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe("nabda/no-physical-properties");
    expect(messages[0]?.message).toBe("Use the logical equivalent.");
  });

  it("fails on physical CSS properties through the CSS processor", () => {
    const source = readFileSync(cssFixturePath, "utf8");
    const processor = nabdaPlugin.processors.css;
    const blocks = processor.preprocess(source, "physical-properties.css");
    const messageLists = blocks.map((block) =>
      new Linter().verify(block.text, ruleConfig, { filename: block.filename }),
    );
    const messages = processor.postprocess(messageLists);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.ruleId).toBe("nabda/no-physical-properties");
    expect(messages[0]?.line).toBe(2);
  });
});
