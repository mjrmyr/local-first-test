# Athlete

## Purpose
The Athlete domain represents the single user of the application. It stores personal profile information used to personalize the training experience.

## Data Model

```typescript
interface Athlete extends EntityMetadata, SoftDeletable {
    name: string;
    gender: Gender;
    birthday: string;   // ISO date string
    weight?: number;    // kg
    height?: number;    // cm
}
```

See [entities.md](../entities.md) for `EntityMetadata` and `SoftDeletable`. See [types.md](../types.md) for `Gender`.

## Business Rules

1. Exactly one **active** (`deleted = 0`) Athlete record exists at any time.
2. `name` is required and must be non-empty.
3. `weight` and `height` are optional but must be positive numbers when provided.
4. The Athlete is created during onboarding and the active record is never hard-deleted.
5. Updating `weight` uses the **tombstone pattern**: a new Athlete record is inserted with the updated values and `deleted = 0`; the previous record is soft-deleted (`deleted = 1`). This allows querying the full history of weight changes over time.

## Operations

- **Create** — Created once during onboarding. Requires `name`, `gender`, `birthday`. Writes to IndexedDB with `deleted = 0`.
- **Read** — Load the single active athlete record (`deleted = 0`).
- **Read history** — Query all records (including `deleted = 1`) for historic data (e.g. weight over time).
- **Update** — Applies the tombstone pattern: inserts a new record with changed values, soft-deletes the previous record.

## UI

### Pages
- **OnboardingPage** — Multi-step wizard that collects `name`, `gender`, and `birthday` to create the Athlete record.
- **Profile page** (planned) — Displays and allows editing of all Athlete fields.

### Key Flows

**Onboarding (first launch):**
1. Welcome screen
2. User enters name
3. User selects gender
4. User enters birthday (optional)
5. Athlete record created → navigate to home

## Storage

- Table: `athletes`
- Indexes: `deleted`, `updatedAt` (for filtering active record and ordering history)

## Integration Points

- **Session**: Sessions belong to the athlete implicitly (single-user app, no foreign key needed).
- **TrainingZone**: Training zones describe the athlete's physical capabilities — they are owned by the athlete.
