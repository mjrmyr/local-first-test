import type { CreateSessionDTO } from '../models/session';

export interface SessionErrors {
    name?: string;
    date?: string;
    discipline?: string;
    totalDuration?: string;
    totalDistance?: string;
}

export function validateSession(input: CreateSessionDTO): SessionErrors | null {
    const errors: SessionErrors = {};

    if (!input.name?.trim()) {
        errors.name = 'Name is required';
    }

    if (!input.date?.trim()) {
        errors.date = 'Date is required';
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

    const hasErrors =
        errors.name !== undefined ||
        errors.date !== undefined ||
        errors.discipline !== undefined ||
        errors.totalDuration !== undefined ||
        errors.totalDistance !== undefined;

    return hasErrors ? errors : null;
}
