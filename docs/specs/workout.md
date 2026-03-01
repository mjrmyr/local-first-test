# Workout

## Purpose
A Workout is a reusable training template. It lives in the athlete's workout library and can be assigned to any session. Workouts allow athletes to design structured training recipes once and reuse them across multiple sessions.

## Data Model

```typescript
interface Workout extends EntityMetadata {
    name: string;
    discipline: Discipline;
    totalDuration?: number; // minutes
    totalDistance?: number; // kilometers
    notes?: string;
    steps: WorkoutStep[];
}

interface WorkoutStep {
    name: string;
    type: WorkoutStepType;     // "single" | "repeat"
    repeats?: number;           // required when type is "repeat"
    metric: WorkoutStepMetric; // "minutes" | "kilometers"
    value: number;
    notes?: string;
}
```

See [entities.md](../entities.md) for `EntityMetadata`. See [types.md](../types.md) for `Discipline`, `WorkoutStepType`, and `WorkoutStepMetric`.

## Business Rules

1. `name` is required and must be non-empty.
2. `discipline` is required.
3. A workout must have one or more steps — a step-less workout is invalid.
4. A `WorkoutStep` with `type = "repeat"` must have `repeats` defined and `repeats >= 2`.
5. A `WorkoutStep` with `type = "single"` must not have `repeats`.
6. `value` on a step must be a positive number.
7. `totalDuration` and `totalDistance` must be positive numbers when provided.
8. Deleting a workout does not affect any sessions that were already created from it (sessions hold an independent copy of steps).

## Operations

- **Create** — User authors a new workout with name, discipline, and one or more steps.
- **Read** — Load a single workout by id.
- **List** — Load all workouts (the library view), optionally filtered by discipline.
- **Update** — Overwrites the existing record in place. Step order matters and must be preserved.
- **Delete** — Hard-deletes the workout record. Does not affect existing sessions.
- **Assign to Session** — User picks this workout when creating/editing a session; its data is copied into the session.

## UI

### Pages
- **Workout library page** (`/workouts`) — Grid or list of all workouts. Filterable by discipline. Entry point for creating new workouts.
- **Workout detail page** (`/workouts/:id`) — Shows all workout data and its steps in order.
- **Workout create page** (`/workouts/new`) — Form with a step builder to create a new workout.
- **Workout edit page** (`/workouts/:id/edit`) — Form with a step builder to modify an existing workout.

### Key Flows

**Creating a workout:**
1. User navigates to the library and taps "New Workout"
2. Fills in name and discipline
3. Adds steps using the step builder (choose type, metric, value)
4. Optionally adds notes
5. Saves → workout appears in the library

**Adding a step of type "repeat":**
1. User taps "Add Step" → selects type "repeat"
2. Enters the number of repeats and defines the step duration/distance
3. Saves the step

## Storage

- Table: `workouts`
- Indexes: `discipline` (for library filtering by sport)
- `steps` are stored as an embedded JSON array within the `workouts` document. There is no separate `steps` table.

## Integration Points

- **Session**: A workout's data can be copied into a session. After copying, session and workout are fully independent.
