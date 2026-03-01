# Session

## Purpose
A Session represents a planned or completed training unit on a specific date. It is the primary item on the athlete's training calendar. A session may optionally be instantiated from a Workout template, but it can also exist independently.

## Data Model

```typescript
interface Session extends EntityMetadata {
    name: string;
    date: string;           // ISO date string
    discipline: Discipline;
    totalDuration?: number; // minutes
    totalDistance?: number; // kilometers
    note?: string;
    steps?: WorkoutStep[];  // inherited or manually set
}
```

See [entities.md](../entities.md) for `EntityMetadata` and `WorkoutStep`. See [types.md](../types.md) for `Discipline`.

## Business Rules

1. `date` is always required — a session without a date cannot exist.
2. `name` is required and must be non-empty.
3. `discipline` is required.
4. `steps` are optional. A session without steps is valid (just a scheduled block of time).
5. When a session is created from a Workout, it copies the workout's `name`, `discipline`, `totalDuration`, `totalDistance`, and `steps`. These copies are independent — editing the session does not affect the source workout and vice versa.
6. `totalDuration` and `totalDistance` must be positive numbers when provided.

## Operations

- **Create (blank)** — User creates a session from scratch for a given date. Requires `name`, `date`, `discipline`.
- **Create from Workout** — User picks a workout from the library; its data is copied into a new session for a chosen date.
- **Read** — Load a single session by id.
- **List by date / range** — Load all sessions for a given day, week, or month (calendar view).
- **Update** — Overwrites the existing record in place. Validates before saving.
- **Delete** — Hard-deletes the session record. Irreversible.

## UI

### Pages
- **Calendar / Home page** (`/`) — Shows sessions grouped by date. Entry point for creating new sessions.
- **Session detail page** (`/sessions/:id`) — Shows all session data, steps, and notes.
- **Session create page** (`/sessions/new`) — Form to create a session. Optionally pick a workout from the library to pre-fill.
- **Session edit page** (`/sessions/:id/edit`) — Form to modify an existing session.

### Key Flows

**Creating a session from the calendar:**
1. User taps a date on the calendar
2. Selects "New Session"
3. Fills in name, discipline, optional duration/distance
4. Optionally selects a workout from the library to import steps
5. Saves → session appears on the calendar

**Editing a session:**
1. User taps a session on the calendar
2. Navigates to detail / edit view
3. Modifies fields or steps
4. Saves → changes persisted

## Storage

- Table: `sessions`
- Indexes: `date` (for calendar queries by day/week/month)
- `steps` are stored as an embedded JSON array within the `sessions` document. There is no separate `steps` table.

## Integration Points

- **Workout**: A session can be seeded from a workout. After creation, the two are fully independent.
- **Athlete**: Implicitly scoped to the single athlete. No foreign key needed.
