import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".git")) {
  const result = spawnSync("pnpm", ["exec", "husky"], {
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}
