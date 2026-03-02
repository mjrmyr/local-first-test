import type { CreateThresholdDTO } from '../models/threshold';
import { VALID_THRESHOLD_COMBINATIONS } from '../models/threshold';

export interface ThresholdErrors {
    discipline?: string;
    metric?: string;
    value?: string;
}

export function validateThreshold(input: CreateThresholdDTO): ThresholdErrors | null {
    const errors: ThresholdErrors = {};

    if (!input.discipline) {
        errors.discipline = 'Discipline is required';
    }

    if (!input.metric) {
        errors.metric = 'Metric is required';
    }

    if (input.discipline && input.metric) {
        const validMetrics = VALID_THRESHOLD_COMBINATIONS[input.discipline];
        if (!validMetrics.includes(input.metric)) {
            errors.metric = `${input.metric} is not valid for ${input.discipline}`;
        }
    }

    if (input.value === undefined || input.value === null || isNaN(input.value)) {
        errors.value = 'Value is required';
    } else if (input.value <= 0) {
        errors.value = 'Value must be a positive number';
    }

    const hasErrors =
        errors.discipline !== undefined ||
        errors.metric !== undefined ||
        errors.value !== undefined;

    return hasErrors ? errors : null;
}
