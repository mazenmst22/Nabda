import { spawn } from "node:child_process";
import path from "node:path";

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextCli, "dev"], {
  env: {
    ...process.env,
    NEXT_PUBLIC_ENABLE_PREVIEW: process.env.NEXT_PUBLIC_ENABLE_PREVIEW ?? "1",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 1));
