import { describe, it, expect } from 'vitest';
import { validateWorkout } from '@/domain/rules/validateWorkout';
import type { CreateWorkoutDTO, WorkoutStep } from '@/domain/models/workout';

const validStep: WorkoutStep = {
    name: 'Warmup',
    type: 'single',
    metric: 'distance',
    unit: 'kilometers',
    value: 2,
};

const validRepeatStep: WorkoutStep = {
    name: 'Intervals',
    type: 'repeat',
    repeats: 4,
    metric: 'time',
    unit: 'minutes',
    value: 5,
};

const validDTO: CreateWorkoutDTO = {
    name: 'Tempo Run',
    discipline: 'run',
    steps: [validStep],
};

describe('validateWorkout', () => {
    it('returns null for a valid workout', () => {
        expect(validateWorkout(validDTO)).toBeNull();
    });

    it('returns null with optional totals', () => {
        expect(validateWorkout({ ...validDTO, totalDuration: 60, totalDistance: 10 })).toBeNull();
    });

    it('requires name', () => {
        expect(validateWorkout({ ...validDTO, name: '' })?.name).toBe('Name is required');
    });

    it('requires discipline', () => {
        expect(validateWorkout({ ...validDTO, discipline: '' as any })?.discipline).toBe('Discipline is required');
    });

    it('rejects zero totalDuration', () => {
        expect(validateWorkout({ ...validDTO, totalDuration: 0 })?.totalDuration).toBeDefined();
    });

    it('rejects negative totalDistance', () => {
        expect(validateWorkout({ ...validDTO, totalDistance: -1 })?.totalDistance).toBeDefined();
    });

    it('requires at least one step', () => {
        expect(validateWorkout({ ...validDTO, steps: [] })?.steps).toBe('A workout must have at least one step');
    });

    it('validates step name', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, name: '' }] });
        expect(result?.stepErrors?.[0]?.name).toBe('Step name is required');
    });

    it('validates step type', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, type: '' as any }] });
        expect(result?.stepErrors?.[0]?.type).toBe('Step type is required');
    });

    it('requires repeats for repeat steps', () => {
        const step = { ...validRepeatStep, repeats: undefined };
        const result = validateWorkout({ ...validDTO, steps: [step] });
        expect(result?.stepErrors?.[0]?.repeats).toBe('Repeats is required for repeat steps');
    });

    it('requires repeats >= 2 for repeat steps', () => {
        const step = { ...validRepeatStep, repeats: 1 };
        const result = validateWorkout({ ...validDTO, steps: [step] });
        expect(result?.stepErrors?.[0]?.repeats).toBe('Repeats must be at least 2');
    });

    it('rejects repeats on single steps', () => {
        const step = { ...validStep, repeats: 3 };
        const result = validateWorkout({ ...validDTO, steps: [step] });
        expect(result?.stepErrors?.[0]?.repeats).toBe('Single steps must not have repeats');
    });

    it('accepts valid repeat step', () => {
        expect(validateWorkout({ ...validDTO, steps: [validRepeatStep] })).toBeNull();
    });

    it('validates step metric', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, metric: '' as any }] });
        expect(result?.stepErrors?.[0]?.metric).toBe('Metric is required');
    });

    it('validates step unit', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, unit: '' as any }] });
        expect(result?.stepErrors?.[0]?.unit).toBe('Unit is required');
    });

    it('rejects invalid unit for distance metric', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, metric: 'distance', unit: 'minutes' }] });
        expect(result?.stepErrors?.[0]?.unit).toBe('Invalid unit for distance');
    });

    it('rejects invalid unit for time metric', () => {
        const step: WorkoutStep = { ...validStep, metric: 'time', unit: 'kilometers' };
        const result = validateWorkout({ ...validDTO, steps: [step] });
        expect(result?.stepErrors?.[0]?.unit).toBe('Invalid unit for time');
    });

    it('validates step value is required', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, value: undefined as any }] });
        expect(result?.stepErrors?.[0]?.value).toBe('Value is required');
    });

    it('rejects NaN step value', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, value: NaN }] });
        expect(result?.stepErrors?.[0]?.value).toBe('Value is required');
    });

    it('rejects zero step value', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, value: 0 }] });
        expect(result?.stepErrors?.[0]?.value).toBe('Value must be a positive number');
    });

    it('rejects negative step value', () => {
        const result = validateWorkout({ ...validDTO, steps: [{ ...validStep, value: -1 }] });
        expect(result?.stepErrors?.[0]?.value).toBe('Value must be a positive number');
    });

    it('validates multiple steps independently', () => {
        const badStep = { ...validStep, name: '' };
        const result = validateWorkout({ ...validDTO, steps: [validStep, badStep] });
        expect(result?.stepErrors?.[0]).toEqual({});
        expect(result?.stepErrors?.[1]?.name).toBeDefined();
    });
});
