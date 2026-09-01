import { spawn } from "node:child_process";
import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const outputRoot = path.join(root, "preview");
const shotsRoot = path.join(outputRoot, "shots");
const baseUrl = process.env.PREVIEW_BASE_URL ?? "http://localhost:3000";
const locales = ["ar", "en"];
const themes = ["light", "dark"];
const viewports = [390, 1280];
let server;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeName(value) {
  return value
    .replaceAll(/[^a-z0-9-]+/giu, "-")
    .replaceAll(/^-|-$/gu, "")
    .toLowerCase();
}

async function previewIsReady() {
  try {
    const response = await fetch(`${baseUrl}/ar/dev/preview`, { redirect: "manual" });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await previewIsReady()) return;
  server = spawn(process.execPath, [path.join(root, "scripts", "dev.mjs")], {
    cwd: root,
    env: { ...process.env, NEXT_PUBLIC_ENABLE_PREVIEW: "1" },
    stdio: "inherit",
  });
  const started = Date.now();
  while (!(await previewIsReady())) {
    if (server.exitCode !== null) throw new Error("The preview development server stopped early.");
    if (Date.now() - started > 120_000) throw new Error("Timed out starting the preview server.");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function main() {
  await ensureServer();
  const resume = process.env.PREVIEW_SHOTS_RESUME === "1";
  if (!resume) await rm(shotsRoot, { recursive: true, force: true });
  await mkdir(shotsRoot, { recursive: true });

  const browser = await chromium.launch();
  const inventoryPage = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  await inventoryPage.goto(`${baseUrl}/en/dev/preview?showBlocked=1`, {
    waitUntil: "domcontentloaded",
  });
  const inventory = await inventoryPage.locator("[data-preview-entry-id]").evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.getAttribute("data-preview-entry-id") ?? "",
      name: element.querySelector("span")?.textContent?.trim() ?? "Unnamed screen",
      supported: element.getAttribute("data-preview-supported") === "true",
    })),
  );
  await inventoryPage.close();
  const matchPattern = process.env.PREVIEW_SHOTS_MATCH
    ? new RegExp(process.env.PREVIEW_SHOTS_MATCH, "u")
    : null;
  const matchingInventory = matchPattern
    ? inventory.filter((entry) => matchPattern.test(entry.id))
    : inventory;
  const configuredLimit = Number(process.env.PREVIEW_SHOTS_LIMIT ?? matchingInventory.length);
  const entries = matchingInventory.slice(
    0,
    Number.isFinite(configuredLimit) ? configuredLimit : matchingInventory.length,
  );
  const tasks = entries.flatMap((entry) =>
    locales.flatMap((locale) =>
      themes.flatMap((theme) => viewports.map((viewport) => ({ entry, locale, theme, viewport }))),
    ),
  );
  const configuredWorkers = Number(process.env.PREVIEW_SHOTS_WORKERS ?? 4);
  const workerCount = Math.min(8, Math.max(1, configuredWorkers));

  function taskFileName({ entry, locale, theme, viewport }) {
    return `${safeName(entry.id)}--${locale}--${theme}--${viewport}.png`;
  }

  const existingShots = resume ? new Set(await readdir(shotsRoot)) : new Set();
  const renderTasks = tasks.filter(
    (task) => task.entry.supported && !existingShots.has(taskFileName(task)),
  );
  let cursor = 0;
  let completed = 0;

  async function captureWorker() {
    const context = await browser.newContext({ viewport: { width: 1800, height: 1000 } });
    const page = await context.newPage();
    try {
      while (cursor < renderTasks.length) {
        const index = cursor;
        cursor += 1;
        const task = renderTasks[index];
        if (!task) break;
        const { entry, locale, theme, viewport } = task;
        const parameters = new URLSearchParams({
          screen: entry.id,
          theme,
          viewport: String(viewport),
        });
        const targetUrl = `${baseUrl}/${locale}/dev/preview?${parameters}`;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            await page.goto(targetUrl, {
              waitUntil: "domcontentloaded",
              timeout: 90_000,
            });
            await page.locator(".preview-harness[data-preview-ready='true']").waitFor({
              state: "visible",
              timeout: 90_000,
            });
            break;
          } catch (error) {
            if (attempt === 2) throw error;
            await page.goto("about:blank");
          }
        }
        await page.waitForTimeout(100);
        const fileName = taskFileName(task);
        const frameBox = await page.locator("[data-preview-capture] iframe").boundingBox();
        if (!frameBox) throw new Error(`Could not measure the iframe for ${entry.id}.`);
        await page.screenshot({
          path: path.join(shotsRoot, fileName),
          animations: "disabled",
          clip: frameBox,
        });
        completed += 1;
        process.stdout.write(
          `Rendered ${completed}/${renderTasks.length}: ${entry.name} · ${locale} · ${theme} · ${viewport}\n`,
        );
      }
    } finally {
      await context.close();
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => captureWorker()));

  await browser.close();
  const blockedTasks = tasks.filter(({ entry }) => !entry.supported);
  await Promise.all(
    blockedTasks.map(async (task) => {
      const happyId = task.entry.id.replace(
        /--(?:loading|empty|error|permission-denied|slot-taken|hold-expired|low-confidence|invalid-json)$/u,
        "--happy",
      );
      const sourceName = taskFileName({
        ...task,
        entry: { ...task.entry, id: happyId },
      });
      await copyFile(path.join(shotsRoot, sourceName), path.join(shotsRoot, taskFileName(task)));
    }),
  );
  const captures = tasks.map((task) => ({ ...task.entry, ...task, fileName: taskFileName(task) }));
  const figures = captures
    .map(
      (capture) => `<figure>
  <a href="shots/${encodeURIComponent(capture.fileName)}"><img src="shots/${encodeURIComponent(capture.fileName)}" alt="${escapeHtml(capture.name)}"></a>
  <figcaption><strong>${escapeHtml(capture.name)}</strong><span>${capture.locale} · ${capture.theme} · ${capture.viewport}px</span></figcaption>
</figure>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nabda screen preview</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
    header { margin-block-end: 24px; }
    h1, p { margin-block: 0 8px; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    figure { margin: 0; padding: 10px; border: 1px solid; border-radius: 10px; }
    img { display: block; inline-size: 100%; block-size: 340px; object-fit: contain; object-position: top; }
    figcaption { padding-block-start: 10px; display: grid; gap: 4px; }
    figcaption span { font-size: 0.82rem; }
  </style>
</head>
<body>
  <header><h1>Nabda screen preview</h1><p>${captures.length} captures generated from the real application routes.</p></header>
  <main>${figures}</main>
</body>
</html>`;
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  process.stdout.write(`Contact sheet: ${path.join(outputRoot, "index.html")}\n`);
}

try {
  await main();
} finally {
  server?.kill("SIGTERM");
}
