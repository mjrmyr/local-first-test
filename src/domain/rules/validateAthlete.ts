import type { CreateAthleteDTO } from '../models/athlete';

type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateAthlete(input: CreateAthleteDTO): FieldErrors<CreateAthleteDTO> | null {
    const errors: FieldErrors<CreateAthleteDTO> = {};

    if (!input.name?.trim()) {
        errors.name = 'Name is required';
    }

    if (!input.birthday) {
        errors.birthday = 'Birthday is required';
    }

    if (input.weight !== undefined && input.weight <= 0) {
        errors.weight = 'Weight must be positive';
    }

    if (input.height !== undefined && input.height <= 0) {
        errors.height = 'Height must be positive';
    }

    return Object.keys(errors).length > 0 ? errors : null;
}
