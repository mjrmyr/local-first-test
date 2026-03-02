import type { EntityMetadata, SoftDeletable } from '../entities';
import type { Discipline, Metric } from '../types';

export interface Threshold extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric;
    value: number;
}

export interface CreateThresholdDTO {
    discipline: Discipline;
    metric: Metric;
    value: number;
}

export interface UpdateThresholdDTO {
    value: number;
}

// Valid (discipline, metric) combinations per spec.
export const VALID_THRESHOLD_COMBINATIONS: Record<Discipline, Metric[]> = {
    swim: ['pace'],
    bike: ['power', 'hr'],
    run: ['pace', 'hr'],
};
