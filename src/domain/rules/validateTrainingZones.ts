import type { CreateTrainingZonesDTO, TrainingZone } from '../models/trainingZone';

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

    const zoneErrors: ZoneRowErrors[] = input.zones.map((zone: TrainingZone) => {
        const rowErrors: ZoneRowErrors = {};
        if (!zone.name?.trim()) {
            rowErrors.name = 'Name is required';
        }
        if (zone.min === undefined || zone.min === null || isNaN(zone.min)) {
            rowErrors.min = 'Min is required';
        } else if (zone.max === undefined || zone.max === null || isNaN(zone.max)) {
            rowErrors.max = 'Max is required';
        } else if (zone.min >= zone.max) {
            rowErrors.min = 'Min must be less than max';
        }
        return rowErrors;
    });

    const hasZoneErrors = zoneErrors.some(
        (e) => e.name !== undefined || e.min !== undefined || e.max !== undefined,
    );
    if (hasZoneErrors) {
        errors.zoneErrors = zoneErrors;
    }

    // Validate ascending order: min of zone N+1 >= max of zone N
    if (!hasZoneErrors) {
        for (let i = 1; i < input.zones.length; i++) {
            if (input.zones[i].min < input.zones[i - 1].max) {
                errors.zones = `Zone ${i + 1} min must be ≥ zone ${i} max (zones must be ordered)`;
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
