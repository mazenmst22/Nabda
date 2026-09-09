# `.github/`

Repository automation and GitHub-facing configuration.

| Path                    | Purpose                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflows/quality.yml` | Pull-request quality gate: lint, `prettier --check`, typecheck, Vitest, `next build`, per-route JavaScript budget, Playwright suites, Lighthouse CI. |

## Conventions

- Workflows run on `pull_request` only. `main` is protected by the same gate via required checks.
- Every job pins `pnpm@11.19.0` and Node 22 and installs with `--frozen-lockfile`. Bump the pin in the workflow and `pnpm-workspace.yaml` together.
- Build outputs that a workflow uploads (bundle reports, Playwright traces, Lighthouse runs) are written to `artifacts/` — see [`../artifacts/README.md`](../artifacts/README.md).
- Adding a new `pnpm` script that CI must enforce means adding it to `quality.yml`; a script that only exists in `package.json` is not a gate.
