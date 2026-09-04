# `artifacts/`

Generated build and CI output. **Everything here except this file is ignored by git.**

| Producer                                   | Writes                                           |
| ------------------------------------------ | ------------------------------------------------ |
| `pnpm bundle:report` / `pnpm bundle:check` | `bundle-report.json`, `bundle-report.md`         |
| `.github/workflows/quality.yml`            | Uploads `bundle-report.*` as a workflow artifact |

Nothing in this folder is a source of truth. Delete it freely; the next build regenerates it.
