import { gzipSync } from "node:zlib";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, ".next");
const outputDir = path.join(root, "artifacts");
const budgetBytes = 120 * 1024;
const check = process.argv.includes("--check");

const manifest = JSON.parse(await readFile(path.join(nextDir, "app-build-manifest.json"), "utf8"));

function isPage(entry) {
  return entry.endsWith("/page") && !entry.startsWith("/_not-found");
}

function displayRoute(entry) {
  const clean = entry
    .replace(/\/page$/u, "")
    .replaceAll(/\/\([^/]+\)/gu, "")
    .replace("/[locale]", "/{locale}");
  return clean || "/{locale}";
}

async function fileMetrics(file) {
  const absolute = path.join(nextDir, file);
  const contents = await readFile(absolute);
  return {
    raw: (await stat(absolute)).size,
    gzip: gzipSync(contents, { level: 9 }).byteLength,
  };
}

const metricsByFile = new Map();
async function metrics(file) {
  if (!metricsByFile.has(file)) metricsByFile.set(file, fileMetrics(file));
  return metricsByFile.get(file);
}

const pageEntries = Object.keys(manifest.pages).filter(isPage).sort();
const pageScriptSets = pageEntries.map(
  (entry) => new Set((manifest.pages[entry] ?? []).filter((file) => file.endsWith(".js"))),
);
const sharedScripts = new Set(
  [...(pageScriptSets[0] ?? [])].filter((file) => pageScriptSets.every((files) => files.has(file))),
);

const rows = [];
for (const entry of pageEntries) {
  const files = [
    ...new Set((manifest.pages[entry] ?? []).filter((file) => file.endsWith(".js"))),
  ].filter((file) => !sharedScripts.has(file));
  let rawBytes = 0;
  let gzipBytes = 0;
  for (const file of files) {
    const size = await metrics(file);
    rawBytes += size.raw;
    gzipBytes += size.gzip;
  }
  rows.push({
    route: displayRoute(entry),
    entry,
    scripts: files.length,
    rawBytes,
    gzipBytes,
    budgetBytes,
    status: gzipBytes <= budgetBytes ? "PASS" : "FAIL",
  });
}

await mkdir(outputDir, { recursive: true });
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const markdown = [
  "<!-- nabda-bundle-report -->",
  "## Per-route JavaScript",
  "",
  `Budget: **${kb(budgetBytes)} gzip per route**. This report measures route-owned client chunks and is a hard precondition of the Lighthouse command.`,
  "",
  "| Route | Scripts | Gzip | Raw | Gate |",
  "| --- | ---: | ---: | ---: | :---: |",
  ...rows.map(
    (row) =>
      `| \`${row.route}\` | ${row.scripts} | ${kb(row.gzipBytes)} | ${kb(row.rawBytes)} | ${row.status} |`,
  ),
  "",
  `Result: **${rows.every((row) => row.status === "PASS") ? "PASS" : "FAIL"}**`,
  "",
].join("\n");

await Promise.all([
  writeFile(path.join(outputDir, "bundle-report.md"), markdown),
  writeFile(path.join(outputDir, "bundle-report.json"), `${JSON.stringify(rows, null, 2)}\n`),
]);

process.stdout.write(markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  const current = await readFile(process.env.GITHUB_STEP_SUMMARY, "utf8").catch(() => "");
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${current}${markdown}`);
}

const failures = rows.filter((row) => row.status === "FAIL");
if (check && failures.length) {
  process.stderr.write(
    `\nRoute JavaScript budget exceeded on ${failures.length} route(s): ${failures
      .map((row) => `${row.route} (${kb(row.gzipBytes)})`)
      .join(", ")}\n`,
  );
  process.exitCode = 1;
}
