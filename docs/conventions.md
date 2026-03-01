# Conventions

## IDs

All entity IDs are **UUID v4** strings, generated at the point of creation (in the application layer, before writing to IndexedDB). Never generate IDs inside repository functions.

```typescript
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
```

## Pace Format

Pace is stored internally as **seconds per kilometer** (a plain `number`). All persistence and domain logic operates on this raw value.

The UI always displays pace as `mm:ss` (minutes and seconds per kilometer). Conversion happens at the UI boundary only — never in the domain or persistence layers.

```typescript
// seconds → "mm:ss"
function formatPace(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// "mm:ss" → seconds
function parsePace(value: string): number {
    const [m, s] = value.split(':').map(Number);
    return m * 60 + s;
}
```

## Error Handling

Services and repositories return a `Result<T>` type instead of throwing. UI components read the result and decide what to display.

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

### Rules
1. Repositories return raw data or throw only for truly unexpected errors (e.g. IndexedDB corruption). Services catch those and convert them to `Result`.
2. Services always return `Result<T>`. Never `throw` from a service.
3. UI components check `result.ok` before accessing data. On `ok: false`, display the `error` string below the relevant form or action.
4. The `error` string in `Result` is a human-readable message suitable for display directly in the UI.

## Validation

Field validation is done with hand-written validator functions in `src/domain/rules/`. No external validation library.

```typescript
// src/domain/rules/validateAthlete.ts
type FieldErrors<T> = Partial<Record<keyof T, string>>;

function validateAthlete(input: CreateAthleteDTO): FieldErrors<CreateAthleteDTO> | null {
    const errors: FieldErrors<CreateAthleteDTO> = {};
    if (!input.name?.trim()) errors.name = 'Name is required';
    if (input.weight !== undefined && input.weight <= 0) errors.weight = 'Weight must be positive';
    return Object.keys(errors).length > 0 ? errors : null;
}
```

### Rules
1. Validators are named `validate<Entity>` and live in `src/domain/rules/validate<Entity>.ts`.
2. They accept a DTO and return `FieldErrors<DTO> | null` — `null` means valid.
3. `FieldErrors` is a partial record mapping field name → error message string.
4. Validators are called by the service layer before writing to the repo. They may also be called by UI components on blur/change for immediate feedback.
5. Error messages are user-facing strings — keep them short and clear.

## UI Components

All shared UI components live flat in `src/ui/components/`. No sub-grouping by type.

```
src/ui/
  components/
    Button.tsx
    Input.tsx
    FormField.tsx
    NavBar.tsx
    ...
  pages/
    HomePage.tsx
    ...
```

### Rules
1. Components used by more than one page go in `src/ui/components/`.
2. Components used only by a single page are co-located in the same file as that page (or as a sibling file in `src/ui/pages/`).
3. `FormField` wraps a label, an input, and an optional error message — it is the standard building block for all form inputs.
4. Error messages inside `FormField` appear **below the input field** in red text.

## DTOs

Use explicit, named DTO types instead of inline utility types for all inputs and outputs crossing layer boundaries (e.g. repository function parameters, service inputs).

**Do not** write inline ad-hoc types like:
```typescript
type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;
```

**Instead**, define named DTOs in the domain model file:
```typescript
// src/domain/models/athlete.ts
export interface CreateAthleteDTO { ... }
export interface UpdateAthleteDTO { ... }
```

### Rules
1. DTOs are defined in `src/domain/models/<entity>.ts`, co-located with the entity's field types.
2. Create DTOs are named `Create<Entity>DTO` — they contain all fields required to create a record.
3. Update DTOs are named `Update<Entity>DTO` — they contain only the fields that can change after creation. Fields that are identity or system-managed (`id`, `createdAt`) are never included.
4. Repository functions accept DTOs, not raw DB types or inline utility types.
5. DTOs are plain interfaces — no classes, no decorators, no methods.
