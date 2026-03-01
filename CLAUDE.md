# kaeno — Agent Context

## Project
kaeno is a local-first PWA for endurance athletes to manage training.
See [docs/overview.md](docs/overview.md) for purpose, use cases, and constraints.

## Architecture
React + TypeScript, Dexie (IndexedDB), Tailwind CSS, Vite. State is managed locally in components (useState/useReducer).
Clean Architecture: `domain/` → `application/` → `persistence/` → `ui/`.
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
