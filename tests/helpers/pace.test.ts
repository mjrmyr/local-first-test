import { describe, it, expect } from 'vitest';
import { parseMmSsToSeconds, formatSecondsToMmSs, normalizePaceInput } from '@/helpers/pace';

describe('parseMmSsToSeconds', () => {
    it('parses "5:30" to 330', () => {
        expect(parseMmSsToSeconds('5:30')).toBe(330);
    });

    it('parses "0:00" to 0', () => {
        expect(parseMmSsToSeconds('0:00')).toBe(0);
    });

    it('parses "10:05" to 605', () => {
        expect(parseMmSsToSeconds('10:05')).toBe(605);
    });

    it('parses single-digit seconds "5:5" to 305', () => {
        expect(parseMmSsToSeconds('5:5')).toBe(305);
    });

    it('returns undefined for empty string', () => {
        expect(parseMmSsToSeconds('')).toBeUndefined();
    });

    it('returns undefined for whitespace', () => {
        expect(parseMmSsToSeconds('  ')).toBeUndefined();
    });

    it('returns undefined for invalid format', () => {
        expect(parseMmSsToSeconds('abc')).toBeUndefined();
    });

    it('returns undefined for seconds >= 60', () => {
        expect(parseMmSsToSeconds('5:60')).toBeUndefined();
    });

    it('returns undefined for three-digit seconds', () => {
        expect(parseMmSsToSeconds('5:123')).toBeUndefined();
    });

    it('trims whitespace', () => {
        expect(parseMmSsToSeconds('  5:30  ')).toBe(330);
    });
});

describe('formatSecondsToMmSs', () => {
    it('formats 330 as "5:30"', () => {
        expect(formatSecondsToMmSs(330)).toBe('5:30');
    });

    it('formats 0 as "0:00"', () => {
        expect(formatSecondsToMmSs(0)).toBe('0:00');
    });

    it('formats 605 as "10:05"', () => {
        expect(formatSecondsToMmSs(605)).toBe('10:05');
    });

    it('rounds fractional seconds', () => {
        expect(formatSecondsToMmSs(330.7)).toBe('5:31');
    });

    it('clamps negative to "0:00"', () => {
        expect(formatSecondsToMmSs(-10)).toBe('0:00');
    });

    it('returns empty string for NaN', () => {
        expect(formatSecondsToMmSs(NaN)).toBe('');
    });

    it('returns empty string for Infinity', () => {
        expect(formatSecondsToMmSs(Infinity)).toBe('');
    });
});

describe('normalizePaceInput', () => {
    it('returns empty for empty input', () => {
        expect(normalizePaceInput('')).toBe('');
    });

    it('returns digits only for 1-2 chars', () => {
        expect(normalizePaceInput('5')).toBe('5');
        expect(normalizePaceInput('53')).toBe('53');
    });

    it('inserts colon for 3 digits', () => {
        expect(normalizePaceInput('530')).toBe('5:30');
    });

    it('inserts colon for 4 digits', () => {
        expect(normalizePaceInput('1030')).toBe('10:30');
    });

    it('strips non-digit characters', () => {
        expect(normalizePaceInput('5:30')).toBe('5:30');
        expect(normalizePaceInput('a5b3c0d')).toBe('5:30');
    });

    it('truncates to 4 digits max', () => {
        expect(normalizePaceInput('12345')).toBe('12:34');
    });
});
