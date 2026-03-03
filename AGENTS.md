# kaeno — Codex Agent Context

## Project
kaeno is a local-first PWA for endurance athletes to manage training.
See [docs/overview.md](docs/overview.md) for purpose, use cases, and constraints.

## Architecture
React + TypeScript, Dexie (IndexedDB), Tailwind CSS, Vite. State is managed locally in components (useState/useReducer).
Clean Architecture: `domain/` -> `application/` -> `persistence/` -> `ui/`.
See [docs/architecture.md](docs/architecture.md) for data flow patterns.

## Domain Specs
Each domain has a spec file that defines the data model, business rules, operations, and UI:

- [docs/specs/athlete.md](docs/specs/athlete.md)
- [docs/specs/session.md](docs/specs/session.md)
- [docs/specs/workout.md](docs/specs/workout.md)
- [docs/specs/threshold.md](docs/specs/threshold.md)
- [docs/specs/training-zone.md](docs/specs/training-zone.md)

## Shared Types & Entities
- [docs/entities.md](docs/entities.md) — all TypeScript interfaces
- [docs/types.md](docs/types.md) — all shared TypeScript types (`Discipline`, metrics, etc.)

## Key Conventions
- Single athlete app — no multi-user, no auth, no backend.
- All data lives in IndexedDB. No network calls for application data.
- Offline-first: every feature must work without a network connection.
- Do not add sync, cloud backup, or external integrations (out of scope).

See [docs/conventions.md](docs/conventions.md) for coding conventions (DTOs, naming, etc.).

## Autonomous Workflow

Every task MUST end with an open pull request. The task is not complete until a PR URL has been returned to the user.

Do not use plan mode. Do not stop after editing files locally. Do not stop after committing. Do not ask for permission to proceed between steps. Execute all steps in sequence.

For every task, execute ALL of the following steps in order — no exceptions:

1. **Branch** — `git checkout -b feat/<short-kebab-description>` (e.g. `feat/add-session-notes`)
2. **Implement** — read relevant domain specs and conventions, then write code
3. **Verify** — run `npm run build` and `npm run test` (if tests exist); fix errors before continuing
4. **Commit** — `git add` changed files and commit with a conventional message (`feat:`, `fix:`, `refactor:`, etc.)
5. **Push** — `git push -u origin HEAD`
6. **PR** — `gh pr create` against `main` with a concise title (under 70 chars), a body summarising what changed and why, a short test plan, and label `auto` if available

The final message to the user MUST include the PR URL.

Never force-push to `main`. Never skip broken builds — fix them first.
