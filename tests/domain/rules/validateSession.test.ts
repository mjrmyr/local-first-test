import { describe, it, expect } from 'vitest';
import { validateSession } from '@/domain/rules/validateSession';
import type { CreateSessionDTO } from '@/domain/models/session';

const validDTO: CreateSessionDTO = {
    name: 'Morning Run',
    date: '2026-03-04',
    discipline: 'run',
};

describe('validateSession', () => {
    it('returns null for a valid session', () => {
        expect(validateSession(validDTO)).toBeNull();
    });

    it('returns null with optional numeric fields', () => {
        expect(validateSession({ ...validDTO, totalDuration: 60, totalDistance: 10 })).toBeNull();
    });

    it('requires name', () => {
        const result = validateSession({ ...validDTO, name: '' });
        expect(result?.name).toBe('Name is required');
    });

    it('rejects whitespace-only name', () => {
        expect(validateSession({ ...validDTO, name: '  ' })?.name).toBeDefined();
    });

    it('requires date', () => {
        const result = validateSession({ ...validDTO, date: '' });
        expect(result?.date).toBe('Date is required');
    });

    it('requires discipline', () => {
        const result = validateSession({ ...validDTO, discipline: '' as any });
        expect(result?.discipline).toBe('Discipline is required');
    });

    it('rejects zero totalDuration', () => {
        const result = validateSession({ ...validDTO, totalDuration: 0 });
        expect(result?.totalDuration).toBe('Total duration must be a positive number');
    });

    it('rejects negative totalDuration', () => {
        expect(validateSession({ ...validDTO, totalDuration: -5 })?.totalDuration).toBeDefined();
    });

    it('rejects zero totalDistance', () => {
        const result = validateSession({ ...validDTO, totalDistance: 0 });
        expect(result?.totalDistance).toBe('Total distance must be a positive number');
    });

    it('rejects negative totalDistance', () => {
        expect(validateSession({ ...validDTO, totalDistance: -1 })?.totalDistance).toBeDefined();
    });

    it('allows undefined totalDuration and totalDistance', () => {
        expect(validateSession(validDTO)).toBeNull();
    });

    it('allows null totalDuration and totalDistance', () => {
        expect(validateSession({ ...validDTO, totalDuration: null as any, totalDistance: null as any })).toBeNull();
    });

    it('returns multiple errors', () => {
        const result = validateSession({ name: '', date: '', discipline: '' as any });
        expect(result?.name).toBeDefined();
        expect(result?.date).toBeDefined();
        expect(result?.discipline).toBeDefined();
    });
});
