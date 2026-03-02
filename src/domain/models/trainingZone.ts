import type { EntityMetadata, SoftDeletable } from '../entities';
import type { Discipline, Metric } from '../types';

export const VALID_ZONE_COMBINATIONS: Record<Discipline, Metric[]> = {
    swim: ['pace'],
    bike: ['power', 'hr'],
    run: ['pace', 'hr'],
};

export interface TrainingZone {
    name: string;
    min: number;
    max: number;
}

export interface TrainingZones extends EntityMetadata, SoftDeletable {
    discipline: Discipline;
    metric: Metric;
    zones: TrainingZone[];
}

export interface CreateTrainingZonesDTO {
    discipline: Discipline;
    metric: Metric;
    zones: TrainingZone[];
}

export interface UpdateTrainingZonesDTO {
    zones: TrainingZone[];
}
