import { describe, it, expect } from 'vitest';
import { validateThreshold } from '@/domain/rules/validateThreshold';
import type { CreateThresholdDTO } from '@/domain/models/threshold';
import type { Discipline, Metric } from '@/domain/types';

const validDTO: CreateThresholdDTO = {
    discipline: 'run',
    metric: 'pace',
    value: 300,
};

describe('validateThreshold', () => {
    it('returns null for a valid threshold', () => {
        expect(validateThreshold(validDTO)).toBeNull();
    });

    it('requires discipline', () => {
        expect(validateThreshold({ ...validDTO, discipline: '' as Discipline })?.discipline).toBe('Discipline is required');
    });

    it('requires metric', () => {
        expect(validateThreshold({ ...validDTO, metric: '' as Metric })?.metric).toBe('Metric is required');
    });

    it('rejects invalid metric for discipline (swim + power)', () => {
        const result = validateThreshold({ discipline: 'swim', metric: 'power', value: 100 });
        expect(result?.metric).toBe('power is not valid for swim');
    });

    it('rejects invalid metric for discipline (swim + hr)', () => {
        const result = validateThreshold({ discipline: 'swim', metric: 'hr', value: 150 });
        expect(result?.metric).toBe('hr is not valid for swim');
    });

    it('rejects invalid metric for discipline (bike + pace)', () => {
        const result = validateThreshold({ discipline: 'bike', metric: 'pace', value: 300 });
        expect(result?.metric).toBe('pace is not valid for bike');
    });

    it('accepts valid combinations', () => {
        expect(validateThreshold({ discipline: 'swim', metric: 'pace', value: 100 })).toBeNull();
        expect(validateThreshold({ discipline: 'bike', metric: 'power', value: 250 })).toBeNull();
        expect(validateThreshold({ discipline: 'bike', metric: 'hr', value: 170 })).toBeNull();
        expect(validateThreshold({ discipline: 'run', metric: 'pace', value: 300 })).toBeNull();
        expect(validateThreshold({ discipline: 'run', metric: 'hr', value: 175 })).toBeNull();
    });

    it('requires value', () => {
        expect(validateThreshold({ ...validDTO, value: undefined as unknown as number})?.value).toBe('Value is required');
    });

    it('rejects NaN value', () => {
        expect(validateThreshold({ ...validDTO, value: NaN })?.value).toBe('Value is required');
    });

    it('rejects zero value', () => {
        expect(validateThreshold({ ...validDTO, value: 0 })?.value).toBe('Value must be a positive number');
    });

    it('rejects negative value', () => {
        expect(validateThreshold({ ...validDTO, value: -10 })?.value).toBe('Value must be a positive number');
    });

    it('returns multiple errors', () => {
        const result = validateThreshold({ discipline: '' as Discipline, metric: '' as Metric, value: NaN });
        expect(result?.discipline).toBeDefined();
        expect(result?.metric).toBeDefined();
        expect(result?.value).toBeDefined();
    });
});
