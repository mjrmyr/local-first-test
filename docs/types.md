# Types

## Disciplines
The discipline type represents all the sports that the application handles.

```typescript
type Discipline = "swim" | "bike" | "run"
```

## Workout Step Type

```typescript
type WorkoutStepType = "single" | "repeat"
```

## Workout Step Metrics
The workout step metric type defines what metrics can be used to create workout steps.

```typescript
type WorkoutStepMetric = "kilometers" | "minutes"
```

## Metric
The metric type defines the performance metrics used for thresholds and training zones.

```typescript
type Metric = "hr" | "pace" | "power"
```

## Gender

```typescript
type Gender = "male" | "female" | "other"
```