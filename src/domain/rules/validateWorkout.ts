import type { CreateWorkoutDTO, WorkoutStep } from '../models/workout';

export interface WorkoutErrors {
    name?: string;
    discipline?: string;
    totalDuration?: string;
    totalDistance?: string;
    steps?: string;
    stepErrors?: StepErrors[];
}

export interface StepErrors {
    name?: string;
    type?: string;
    repeats?: string;
    metric?: string;
    value?: string;
}

function validateStep(step: WorkoutStep): StepErrors | null {
    const errors: StepErrors = {};

    if (!step.name?.trim()) {
        errors.name = 'Step name is required';
    }

    if (!step.type) {
        errors.type = 'Step type is required';
    } else if (step.type === 'repeat') {
        if (step.repeats === undefined || step.repeats === null) {
            errors.repeats = 'Repeats is required for repeat steps';
        } else if (step.repeats < 2) {
            errors.repeats = 'Repeats must be at least 2';
        }
    } else if (step.type === 'single') {
        if (step.repeats !== undefined) {
            errors.repeats = 'Single steps must not have repeats';
        }
    }

    if (!step.metric) {
        errors.metric = 'Metric is required';
    }

    if (step.value === undefined || step.value === null || isNaN(step.value)) {
        errors.value = 'Value is required';
    } else if (step.value <= 0) {
        errors.value = 'Value must be a positive number';
    }

    const hasErrors =
        errors.name !== undefined ||
        errors.type !== undefined ||
        errors.repeats !== undefined ||
        errors.metric !== undefined ||
        errors.value !== undefined;

    return hasErrors ? errors : null;
}

export function validateWorkout(input: CreateWorkoutDTO): WorkoutErrors | null {
    const errors: WorkoutErrors = {};

    if (!input.name?.trim()) {
        errors.name = 'Name is required';
    }

    if (!input.discipline) {
        errors.discipline = 'Discipline is required';
    }

    if (input.totalDuration !== undefined && input.totalDuration !== null) {
        if (input.totalDuration <= 0) {
            errors.totalDuration = 'Total duration must be a positive number';
        }
    }

    if (input.totalDistance !== undefined && input.totalDistance !== null) {
        if (input.totalDistance <= 0) {
            errors.totalDistance = 'Total distance must be a positive number';
        }
    }

    if (!input.steps || input.steps.length === 0) {
        errors.steps = 'A workout must have at least one step';
    } else {
        const stepErrors = input.steps.map(validateStep);
        if (stepErrors.some((e) => e !== null)) {
            errors.stepErrors = stepErrors.map((e) => e ?? {});
        }
    }

    const hasErrors =
        errors.name !== undefined ||
        errors.discipline !== undefined ||
        errors.totalDuration !== undefined ||
        errors.totalDistance !== undefined ||
        errors.steps !== undefined ||
        errors.stepErrors !== undefined;

    return hasErrors ? errors : null;
}
