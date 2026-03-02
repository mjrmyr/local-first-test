import type { EntityMetadata, SoftDeletable } from '../entities';
import type { Discipline, Metric } from '../types';

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
