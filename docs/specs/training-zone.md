# TrainingZone

## Purpose
Training Zones describe the athlete's physical capability thresholds for a given discipline and metric. They are used as reference values when structuring workouts or analyzing effort levels. Each zone set is defined per discipline and per metric (e.g., heart rate zones for running, pace zones for cycling).

## Data Model

```typescript
interface TrainingZones extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric; // "hr" | "pace" | "power"
    zones: TrainingZone[];
}

interface TrainingZone {
    name: string;  // e.g. "Zone 1", "Easy", "Threshold"
    min: number;
    max: number;
}
```

See [entities.md](../entities.md) for `EntityMetadata` and `SoftDeletable`. See [types.md](../types.md) for `Discipline` and `Metric`.

## Business Rules

1. Only one **active** (`deleted = 0`) record may exist per `(discipline, metric)` combination. Multiple historical records (with `deleted = 1`) for the same pair are expected and valid.
2. A `TrainingZones` record must have at least one zone.
3. Zones within a set must be ordered by ascending threshold (`min` of zone N+1 >= `max` of zone N).
4. `min` must be less than `max` within a zone.
5. `name` of each zone is required and must be non-empty.
6. `min` and `max` values are in the unit implied by the metric:
   - `hr` → beats per minute (bpm)
   - `pace` → seconds per kilometer
   - `power` → watts
7. Editing a zone set uses the **tombstone pattern**: a new record is inserted with the updated zones and `deleted = 0`; the previous record is soft-deleted (`deleted = 1`). This preserves zone progression history for future analysis.

## Operations

- **Create** — Define a new zone set for a discipline/metric combination. Validates that no active record exists for the pair.
- **Read** — Load the active zone set for a `(discipline, metric)` pair (`deleted = 0`).
- **Read history** — Load all records for a `(discipline, metric)` pair (including `deleted = 1`) ordered by `updatedAt` to inspect zone progression over time.
- **List** — Load all active zone sets. Typically displayed grouped by discipline.
- **Update** — Applies the tombstone pattern: inserts a new record with the changed zones, soft-deletes the previous record.
- **Delete** — Soft-deletes the active record (`deleted = 1`). No new record is created.

## UI

### Pages
- **Training Zones page** — Lists all configured zone sets grouped by discipline. Entry point for creating and editing zones.
- **Zone set editor** — Form to define or edit the zones for one discipline/metric combination. Zones are shown as a list of rows with name, min, and max fields.

### Key Flows

**Configuring zones for the first time:**
1. User navigates to Training Zones
2. Selects a discipline (e.g. "run") and a metric (e.g. "hr")
3. Adds zones one by one with name, min, and max values
4. Saves → zone set appears in the list

**Editing an existing zone set:**
1. User selects a zone set
2. Modifies zone values or adds/removes zones
3. Saves → updated zone set persisted

## Storage

- Table: `trainingZones`
- Indexes: `discipline`, `metric`, `deleted`, `updatedAt` (for active lookup by pair and history ordering)

## Integration Points

- **Athlete**: Zone sets describe the athlete's physical profile. Implicitly owned by the single athlete.
- **Workout / Session** (planned): Zone names may be referenced in workout step notes to describe target effort levels.
