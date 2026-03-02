import type { EntityMetadata, SoftDeletable } from '../entities';
import type { Gender } from '../types';

export interface Athlete extends EntityMetadata, SoftDeletable {
    name: string;
    gender: Gender;
    birthday: string; // ISO date string
    weight?: number;  // kg
    height?: number;  // cm
}

export interface CreateAthleteDTO {
    name: string;
    gender: Gender;
    birthday: string;
    weight?: number;
    height?: number;
}

export interface UpdateAthleteDTO {
    name?: string;
    gender?: Gender;
    birthday?: string;
    weight?: number;
    height?: number;
}
