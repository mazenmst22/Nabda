# `docs/`

Engineering documentation — written for whoever has to change the code.

Source material (client specifications, research manuals, build briefs) is **not** duplicated here. It lives in [`../research/`](../research/README.md) and [`../ux-ui/`](../ux-ui/README.md); the folders below hold engineering notes and short pointers into that source material. One file, one home.

## Map

| Folder        | Holds                                                                               | Status                             |
| ------------- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| `product/`    | Scope decisions, MVP boundaries, acceptance criteria                                | Stub                               |
| `research/`   | Pointers into `research/` plus engineering read-outs of it                          | Stub                               |
| `ux-ui/`      | Pointers into `ux-ui/` plus implementation notes on design intent                   | Stub                               |
| `frontend/`   | App Router structure, state conventions, i18n/RTL rules, component contracts        | Stub                               |
| `backend/`    | API contract and the frontend-to-backend gap register                               | [`GAPS.md`](backend/GAPS.md)       |
| `database/`   | Schema, migrations, tenancy and retention model                                     | Stub                               |
| `ai/`         | Pulse — prompts, tool surface, safety boundaries, transcription/extraction pipeline | Stub                               |
| `testing/`    | Test strategy, mock surfaces, fault injection                                       | [`RUNBOOK.md`](testing/RUNBOOK.md) |
| `security/`   | Auth, RBAC, consent boundaries, audit, PHI handling                                 | Stub                               |
| `deployment/` | Environments, build and release, budgets and observability                          | Stub                               |

## Writing rules

- One topic per file. If a document needs a table of contents, it should probably be two documents.
- Link to code with repo-relative paths so links survive file moves and render on GitHub.
- Record decisions, not narration: what was chosen, what was rejected, and why.
- A stub folder carries a `README.md` describing what belongs there. Delete the stub when the first real document lands.
