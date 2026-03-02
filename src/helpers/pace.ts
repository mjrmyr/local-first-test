export const parseMmSsToSeconds = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const match = trimmed.match(/^(\d+):(\d{1,2})$/);
    if (!match) return undefined;
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return undefined;
    if (seconds < 0 || seconds >= 60) return undefined;
    return minutes * 60 + seconds;
};

export const formatSecondsToMmSs = (value: number): string => {
    if (!Number.isFinite(value)) return '';
    const totalSeconds = Math.max(0, Math.round(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const normalizePaceInput = (value: string): string => {
    const digitsOnly = value.replace(/[^\d]/g, '').slice(0, 4);
    if (digitsOnly === '') return '';
    if (digitsOnly.length <= 2) return digitsOnly;
    const minutes = digitsOnly.slice(0, digitsOnly.length - 2);
    const seconds = digitsOnly.slice(-2);
    return `${minutes}:${seconds}`;
};
