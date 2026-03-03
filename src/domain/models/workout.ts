import type { EntityMetadata } from '../entities';
import type { Discipline, WorkoutStepType, WorkoutStepMetric, WorkoutStepUnit } from '../types';

export interface WorkoutStep {
    name: string;
    type: WorkoutStepType;
    repeats?: number;
    metric: WorkoutStepMetric;
    unit: WorkoutStepUnit;
    value: number;
    notes?: string;
}

export interface Workout extends EntityMetadata {
    name: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    notes?: string;
    steps: WorkoutStep[];
}

export interface CreateWorkoutDTO {
    name: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    notes?: string;
    steps: WorkoutStep[];
}

export interface UpdateWorkoutDTO {
    name: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    notes?: string;
    steps: WorkoutStep[];
}
