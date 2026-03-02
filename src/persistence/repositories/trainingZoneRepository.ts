import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type {
    TrainingZones,
    CreateTrainingZonesDTO,
    UpdateTrainingZonesDTO,
} from '../../domain/models/trainingZone';
import type { Discipline, Metric } from '../../domain/types';

export const trainingZoneRepository = {
    async create(dto: CreateTrainingZonesDTO): Promise<TrainingZones> {
        const now = new Date().toISOString();
        const record: TrainingZones = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            deleted: 0,
            discipline: dto.discipline,
            metric: dto.metric,
            zones: dto.zones,
        };
        await db.trainingZones.add(record);
        return record;
    },

    async getActive(discipline: Discipline, metric: Metric): Promise<TrainingZones | undefined> {
        return db.trainingZones
            .where('deleted')
            .equals(0)
            .filter((r) => r.discipline === discipline && r.metric === metric)
            .first();
    },

    async listActive(): Promise<TrainingZones[]> {
        return db.trainingZones.where('deleted').equals(0).toArray();
    },

    async getHistory(discipline: Discipline, metric: Metric): Promise<TrainingZones[]> {
        return db.trainingZones
            .filter((r) => r.discipline === discipline && r.metric === metric)
            .sortBy('updatedAt');
    },

    async update(current: TrainingZones, dto: UpdateTrainingZonesDTO): Promise<TrainingZones> {
        const now = new Date().toISOString();
        await db.trainingZones.update(current.id, { deleted: 1 });
        const newRecord: TrainingZones = {
            id: uuidv4(),
            createdAt: current.createdAt,
            updatedAt: now,
            deleted: 0,
            discipline: current.discipline,
            metric: current.metric,
            zones: dto.zones,
        };
        await db.trainingZones.add(newRecord);
        return newRecord;
    },

    async softDelete(id: string): Promise<void> {
        await db.trainingZones.update(id, { deleted: 1 });
    },
};
