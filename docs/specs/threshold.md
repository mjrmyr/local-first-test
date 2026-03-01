# Threshold

## Purpose
A Threshold is a single performance marker for a given discipline and metric. It represents the athlete's current capability ceiling for that metric (e.g. FTP in watts, threshold pace, threshold heart rate). Thresholds are the basis for deriving and calibrating training zones.

## Data Model

```typescript
interface Threshold extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric; // "hr" | "pace" | "power"
    value: number;
}
```

See [entities.md](../entities.md) for `EntityMetadata` and `SoftDeletable`. See [types.md](../types.md) for `Discipline` and `Metric`.

## Business Rules

1. Only one **active** (`deleted = 0`) record may exist per `(discipline, metric)` combination. Multiple historical records (with `deleted = 1`) for the same pair are expected and valid.
2. `value` must be a positive number.
3. The unit of `value` is implied by `metric`:
   - `hr` → beats per minute (bpm)
   - `pace` → seconds per kilometer
   - `power` → watts
4. Not every `(discipline, metric)` combination is meaningful — see the valid combinations below:
   - `swim`: `pace`
   - `bike`: `power`, `hr`
   - `run`: `pace`, `hr`
5. Updating a threshold uses the **tombstone pattern**: a new record is inserted with the updated `value` and `deleted = 0`; the previous record is soft-deleted (`deleted = 1`). This preserves the full progression of the athlete's fitness over time.

## Operations

- **Create** — Record a threshold for a `(discipline, metric)` pair. Validates that no active record exists for the pair.
- **Read** — Load the current active threshold for a `(discipline, metric)` pair (`deleted = 0`).
- **Read history** — Load all records for a `(discipline, metric)` pair (including `deleted = 1`) ordered by `updatedAt` to inspect fitness progression over time.
- **List** — Load all active thresholds, typically grouped by discipline.
- **Update** — Applies the tombstone pattern: inserts a new record with the new value, soft-deletes the previous record.
- **Delete** — Soft-deletes the active record (`deleted = 1`). No new record is created.

## UI

### Pages
- **Thresholds page** — Lists current thresholds grouped by discipline. Entry point for adding or updating a threshold.
- **Threshold editor** — Form to enter a threshold value for a specific discipline/metric combination.

### Key Flows

**Recording a new threshold (e.g. after a fitness test):**
1. User navigates to the Thresholds page
2. Selects discipline and metric
3. Enters the new value
4. Saves → tombstone applied, new threshold becomes active

## Storage

- Table: `thresholds`
- Indexes: `discipline`, `metric`, `deleted`, `updatedAt` (for active lookup by pair and history ordering)

## Integration Points

- **TrainingZone**: Thresholds are the reference point for calculating zone boundaries. When a threshold changes, the athlete may want to recalculate their training zones (planned feature for future).
- **Athlete**: Implicitly scoped to the single athlete.
