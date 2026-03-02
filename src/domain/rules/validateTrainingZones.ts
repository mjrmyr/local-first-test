import type { CreateTrainingZonesDTO, TrainingZone } from '../models/trainingZone';
import type { Metric } from '../types';

export interface ZoneRowErrors {
    name?: string;
    min?: string;
    max?: string;
}

export interface TrainingZonesErrors {
    discipline?: string;
    metric?: string;
    zones?: string;
    zoneErrors?: ZoneRowErrors[];
}

// For pace, higher numeric value = slower pace (more seconds/km).
// min represents the slow end (high seconds), max the fast end (low seconds),
// so the valid relationship is min > max — the opposite of HR and power.
function validateMinMax(min: number, max: number, metric: Metric): { valid: boolean; error?: string } {
    if (metric === 'pace') {
        if (min <= max) {
            return { valid: false, error: 'For pace, min (slow end) must be greater than max (fast end)' };
        }
    } else {
        if (min >= max) {
            return { valid: false, error: 'Min must be less than max' };
        }
    }
    return { valid: true };
}

// Check that zone i starts where zone i-1 ends (no gap, no overlap).
// For HR/power: zones ascend numerically → zone[i].min >= zone[i-1].max
// For pace: zones descend numerically (slow → fast) → zone[i].min <= zone[i-1].max
function isOutOfOrder(zones: TrainingZone[], i: number, metric: Metric): boolean {
    if (metric === 'pace') {
        return zones[i].min > zones[i - 1].max;
    }
    return zones[i].min < zones[i - 1].max;
}

export function validateTrainingZones(input: CreateTrainingZonesDTO): TrainingZonesErrors | null {
    const errors: TrainingZonesErrors = {};

    if (!input.discipline) {
        errors.discipline = 'Discipline is required';
    }

    if (!input.metric) {
        errors.metric = 'Metric is required';
    }

    if (!input.zones || input.zones.length === 0) {
        errors.zones = 'At least one zone is required';
        return errors;
    }

    const { metric } = input;

    const zoneErrors: ZoneRowErrors[] = input.zones.map((zone: TrainingZone) => {
        const rowErrors: ZoneRowErrors = {};
        if (!zone.name?.trim()) {
            rowErrors.name = 'Name is required';
        }
        if (zone.min === undefined || zone.min === null || isNaN(zone.min)) {
            rowErrors.min = 'Min is required';
        } else if (zone.max === undefined || zone.max === null || isNaN(zone.max)) {
            rowErrors.max = 'Max is required';
        } else {
            const minMaxResult = validateMinMax(zone.min, zone.max, metric);
            if (!minMaxResult.valid) {
                rowErrors.min = minMaxResult.error;
            }
        }
        return rowErrors;
    });

    const hasZoneErrors = zoneErrors.some(
        (e) => e.name !== undefined || e.min !== undefined || e.max !== undefined,
    );
    if (hasZoneErrors) {
        errors.zoneErrors = zoneErrors;
    }

    // Validate that each zone starts where the previous one ends (no gaps, no overlaps).
    if (!hasZoneErrors) {
        for (let i = 1; i < input.zones.length; i++) {
            if (isOutOfOrder(input.zones, i, metric)) {
                const direction = metric === 'pace' ? '≤' : '≥';
                errors.zones = `Zone ${i + 1} min must be ${direction} zone ${i} max (zones must be ordered)`;
                break;
            }
        }
    }

    const hasErrors =
        errors.discipline !== undefined ||
        errors.metric !== undefined ||
        errors.zones !== undefined ||
        errors.zoneErrors !== undefined;

    return hasErrors ? errors : null;
}
