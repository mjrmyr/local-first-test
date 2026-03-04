import { describe, it, expect } from 'vitest';
import { validateAthlete } from '@/domain/rules/validateAthlete';
import type { CreateAthleteDTO } from '@/domain/models/athlete';

const validDTO: CreateAthleteDTO = {
    name: 'John',
    gender: 'male',
    birthday: '1990-01-01',
};

describe('validateAthlete', () => {
    it('returns null for a valid athlete', () => {
        expect(validateAthlete(validDTO)).toBeNull();
    });

    it('returns null when optional fields are provided', () => {
        expect(validateAthlete({ ...validDTO, weight: 75, height: 180 })).toBeNull();
    });

    it('requires name', () => {
        const result = validateAthlete({ ...validDTO, name: '' });
        expect(result).toEqual({ name: 'Name is required' });
    });

    it('rejects whitespace-only name', () => {
        const result = validateAthlete({ ...validDTO, name: '   ' });
        expect(result?.name).toBeDefined();
    });

    it('requires birthday', () => {
        const result = validateAthlete({ ...validDTO, birthday: '' });
        expect(result?.birthday).toBe('Birthday is required');
    });

    it('rejects zero weight', () => {
        const result = validateAthlete({ ...validDTO, weight: 0 });
        expect(result?.weight).toBe('Weight must be positive');
    });

    it('rejects negative weight', () => {
        const result = validateAthlete({ ...validDTO, weight: -10 });
        expect(result?.weight).toBeDefined();
    });

    it('rejects zero height', () => {
        const result = validateAthlete({ ...validDTO, height: 0 });
        expect(result?.height).toBe('Height must be positive');
    });

    it('rejects negative height', () => {
        const result = validateAthlete({ ...validDTO, height: -5 });
        expect(result?.height).toBeDefined();
    });

    it('allows undefined weight and height', () => {
        expect(validateAthlete({ ...validDTO, weight: undefined, height: undefined })).toBeNull();
    });

    it('returns multiple errors at once', () => {
        const result = validateAthlete({ name: '', gender: 'male', birthday: '', weight: -1, height: -1 });
        expect(result?.name).toBeDefined();
        expect(result?.birthday).toBeDefined();
        expect(result?.weight).toBeDefined();
        expect(result?.height).toBeDefined();
    });
});
