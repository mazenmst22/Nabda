import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nabdaPlugin from "./eslint-rules/nabda/index.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: directory });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "eslint-rules/nabda/fixtures/**",
    ],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: { nabda: nabdaPlugin },
    rules: { "nabda/no-physical-properties": "error" },
  },
  {
    files: ["src/**/*.css"],
    plugins: { nabda: nabdaPlugin },
    processor: "nabda/css",
    rules: { "nabda/no-physical-properties": "error" },
  },
];

export default config;
