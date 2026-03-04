import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    toDateString,
    addDays,
    startOfWeek,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isToday,
    getMonthGrid,
    getWeekDates,
} from '@/helpers/date';

describe('toDateString', () => {
    it('formats date as YYYY-MM-DD', () => {
        expect(toDateString(new Date(2026, 2, 4))).toBe('2026-03-04');
    });

    it('pads single-digit month and day', () => {
        expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});

describe('addDays', () => {
    it('adds positive days', () => {
        const result = addDays(new Date(2026, 2, 1), 3);
        expect(result.getDate()).toBe(4);
    });

    it('subtracts with negative days', () => {
        const result = addDays(new Date(2026, 2, 5), -3);
        expect(result.getDate()).toBe(2);
    });

    it('crosses month boundary', () => {
        const result = addDays(new Date(2026, 0, 31), 1);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(1);
    });

    it('does not mutate original date', () => {
        const original = new Date(2026, 2, 1);
        addDays(original, 5);
        expect(original.getDate()).toBe(1);
    });
});

describe('startOfWeek', () => {
    it('returns Monday for a Wednesday', () => {
        // 2026-03-04 is a Wednesday
        const result = startOfWeek(new Date(2026, 2, 4));
        expect(result.getDay()).toBe(1); // Monday
        expect(result.getDate()).toBe(2);
    });

    it('returns same day for a Monday', () => {
        const result = startOfWeek(new Date(2026, 2, 2));
        expect(result.getDay()).toBe(1);
        expect(result.getDate()).toBe(2);
    });

    it('returns previous Monday for a Sunday', () => {
        // 2026-03-08 is a Sunday
        const result = startOfWeek(new Date(2026, 2, 8));
        expect(result.getDay()).toBe(1);
        expect(result.getDate()).toBe(2);
    });
});

describe('startOfMonth', () => {
    it('returns first day of month', () => {
        const result = startOfMonth(new Date(2026, 2, 15));
        expect(result.getDate()).toBe(1);
        expect(result.getMonth()).toBe(2);
    });
});

describe('endOfMonth', () => {
    it('returns last day of month', () => {
        const result = endOfMonth(new Date(2026, 2, 1));
        expect(result.getDate()).toBe(31);
    });

    it('handles February in non-leap year', () => {
        const result = endOfMonth(new Date(2026, 1, 1));
        expect(result.getDate()).toBe(28);
    });

    it('handles February in leap year', () => {
        const result = endOfMonth(new Date(2024, 1, 1));
        expect(result.getDate()).toBe(29);
    });
});

describe('isSameDay', () => {
    it('returns true for same day', () => {
        expect(isSameDay(new Date(2026, 2, 4, 10, 0), new Date(2026, 2, 4, 23, 59))).toBe(true);
    });

    it('returns false for different days', () => {
        expect(isSameDay(new Date(2026, 2, 4), new Date(2026, 2, 5))).toBe(false);
    });

    it('returns false for different months', () => {
        expect(isSameDay(new Date(2026, 1, 4), new Date(2026, 2, 4))).toBe(false);
    });
});

describe('isToday', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns true for today', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 4, 12, 0));
        expect(isToday(new Date(2026, 2, 4, 8, 0))).toBe(true);
    });

    it('returns false for yesterday', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 4, 12, 0));
        expect(isToday(new Date(2026, 2, 3))).toBe(false);
    });
});

describe('getMonthGrid', () => {
    it('returns 42 dates (6 weeks)', () => {
        const grid = getMonthGrid(2026, 2); // March 2026
        expect(grid).toHaveLength(42);
    });

    it('starts on a Monday', () => {
        const grid = getMonthGrid(2026, 2);
        expect(grid[0].getDay()).toBe(1);
    });

    it('includes the first day of the month', () => {
        const grid = getMonthGrid(2026, 2);
        const hasFirst = grid.some((d) => d.getMonth() === 2 && d.getDate() === 1);
        expect(hasFirst).toBe(true);
    });
});

describe('getWeekDates', () => {
    it('returns 7 dates', () => {
        const dates = getWeekDates(new Date(2026, 2, 4));
        expect(dates).toHaveLength(7);
    });

    it('starts on Monday and ends on Sunday', () => {
        const dates = getWeekDates(new Date(2026, 2, 4));
        expect(dates[0].getDay()).toBe(1);
        expect(dates[6].getDay()).toBe(0);
    });

    it('contains consecutive days', () => {
        const dates = getWeekDates(new Date(2026, 2, 4));
        for (let i = 1; i < dates.length; i++) {
            const diff = dates[i].getTime() - dates[i - 1].getTime();
            expect(diff).toBe(24 * 60 * 60 * 1000);
        }
    });
});
