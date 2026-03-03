/** Format: YYYY-MM-DD */
export function toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/** Monday-based start of week (ISO) */
export function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatWeekday(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
}

export function formatDayMonth(date: Date): string {
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatFullDate(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Get all dates in a month grid (includes leading/trailing days to fill weeks) */
export function getMonthGrid(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const start = startOfWeek(first);
    const dates: Date[] = [];
    let current = new Date(start);
    // Always show 6 weeks for consistent height
    for (let i = 0; i < 42; i++) {
        dates.push(new Date(current));
        current = addDays(current, 1);
    }
    return dates;
}

/** Get all dates in a week */
export function getWeekDates(date: Date): Date[] {
    const start = startOfWeek(date);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        dates.push(addDays(start, i));
    }
    return dates;
}
