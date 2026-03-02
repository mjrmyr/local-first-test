import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Threshold, CreateThresholdDTO, UpdateThresholdDTO } from '../../domain/models/threshold';
import type { Discipline, Metric } from '../../domain/types';

export const thresholdRepository = {
    async create(dto: CreateThresholdDTO): Promise<Threshold> {
        const now = new Date().toISOString();
        const record: Threshold = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            deleted: 0,
            discipline: dto.discipline,
            metric: dto.metric,
            value: dto.value,
        };
        await db.thresholds.add(record);
        return record;
    },

    async getActive(discipline: Discipline, metric: Metric): Promise<Threshold | undefined> {
        return db.thresholds
            .where('deleted')
            .equals(0)
            .filter((r) => r.discipline === discipline && r.metric === metric)
            .first();
    },

    async listActive(): Promise<Threshold[]> {
        return db.thresholds.where('deleted').equals(0).toArray();
    },

    async getHistory(discipline: Discipline, metric: Metric): Promise<Threshold[]> {
        return db.thresholds
            .filter((r) => r.discipline === discipline && r.metric === metric)
            .sortBy('updatedAt');
    },

    async update(current: Threshold, dto: UpdateThresholdDTO): Promise<Threshold> {
        const now = new Date().toISOString();
        await db.thresholds.update(current.id, { deleted: 1 });
        const newRecord: Threshold = {
            id: uuidv4(),
            createdAt: current.createdAt,
            updatedAt: now,
            deleted: 0,
            discipline: current.discipline,
            metric: current.metric,
            value: dto.value,
        };
        await db.thresholds.add(newRecord);
        return newRecord;
    },

    async softDelete(id: string): Promise<void> {
        await db.thresholds.update(id, { deleted: 1 });
    },
};
