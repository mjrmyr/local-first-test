import type { EntityMetadata } from '../entities';
import type { WorkoutStep } from './workout';
import type { Discipline } from '../types';

export interface Session extends EntityMetadata {
    name: string;
    date: string; // ISO date string (YYYY-MM-DD)
    discipline: Discipline;
    totalDuration?: number; // minutes
    totalDistance?: number; // kilometers
    note?: string;
    steps?: WorkoutStep[];
}

export interface CreateSessionDTO {
    name: string;
    date: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    note?: string;
    steps?: WorkoutStep[];
}

export interface UpdateSessionDTO {
    name: string;
    date: string;
    discipline: Discipline;
    totalDuration?: number;
    totalDistance?: number;
    note?: string;
    steps?: WorkoutStep[];
}
