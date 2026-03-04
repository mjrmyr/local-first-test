# Entities

## EntityMetadata
All entities persisted to IndexedDB extend `EntityMetadata`. It provides a consistent identity and audit trail.

```typescript
interface EntityMetadata {
    id: string;
    createdAt: string;  // ISO datetime string
    updatedAt: string;  // ISO datetime string
}
```

## SoftDeletable
A standalone interface for soft-delete behavior. Independent of `EntityMetadata` — entities that need both extend each separately.

```typescript
interface SoftDeletable {
    deleted: 0 | 1;  // soft delete flag: 0 = active, 1 = deleted
}
```

### Tombstone pattern
`Athlete`, `TrainingZones`, and `Threshold` extend both `EntityMetadata` and `SoftDeletable` and use the tombstone pattern. Updates do **not** overwrite the existing record. Instead:
1. A new record is inserted with the updated values, a new `id`, and `deleted = 0`.
2. The previous record is soft-deleted by setting `deleted = 1`.

This preserves the full history of the entity in the table and enables historic queries (e.g. weight over time, zone progression). The "current" record is always the one with `deleted = 0` for the given logical identifier.

---

## Athlete
The athlete entity is the digital representation of the athlete using the application.
It contains the athletes personal information.

```typescript
interface Athlete extends EntityMetadata, SoftDeletable {
    name: string;
    gender: Gender;
    birthday: string;   // ISO date string
    weight?: number;    // kg
    height?: number;    // cm
}
```

Uses the [tombstone pattern](#tombstone-pattern). Updating `weight` creates a new record rather than overwriting.

## Training Zones
Training Zones describe the athletes physical capabilities. Training Zones can be defined for each of
the available disciplines (swim, bike or run).

```typescript
interface TrainingZones extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric; // "hr" | "pace" | "power"
    zones: TrainingZone[];
}

interface TrainingZone {
    name: string;
    min: number;
    max: number;
}
```

Uses the [tombstone pattern](#tombstone-pattern). Editing a zone set creates a new record; the previous one is soft-deleted.

## Threshold
A Threshold is a single performance marker for a given discipline and metric (e.g. FTP in watts, threshold pace).

```typescript
interface Threshold extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric; // "hr" | "pace" | "power"
    value: number;
}
```

Uses the [tombstone pattern](#tombstone-pattern). Updating a threshold value creates a new record to preserve fitness progression history.

## Workout
A workout is a template that an athlete can create in order to reuse it over time.
All created workout (templates) form the workout library the user can choose workouts from.

```typescript
interface Workout extends EntityMetadata {
    name: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    notes?: string;
    steps: WorkoutStep[];
}
```

Updates overwrite the existing record in place. Deletes are hard deletes.

## Workout Steps
Workout steps are the building blocks of workouts. They describe the content of the workout.
In other words, they are the recipe the athlete needs to follow in order to complete the workout.

```typescript
interface WorkoutStep {
    name: string;
    type: WorkoutStepType; // single or repeat
    repeats?: number;
    metric: WorkoutStepMetric; // time or duration
    value: number;
    notes?: string;
}
```

`WorkoutStep` has no dedicated IndexedDB table. Steps are stored as a JSON array embedded within the parent document (`Workout.steps` or `Session.steps`).

## Session
A session represents the planned training. It can be an instance of a workout.
The differences between a session and a workout are that a session always has a date.
Also, a session does not necessarily need to have workout steps defined.

```typescript
interface Session extends EntityMetadata {
    name: string;
    date: string;          // ISO date string
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    note?: string;
    steps?: WorkoutStep[];
    workoutId?: string;    // source workout ID, if created from a template
}
```

Updates overwrite the existing record in place. Deletes are hard deletes.