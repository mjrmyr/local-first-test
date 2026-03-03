import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Session, CreateSessionDTO, UpdateSessionDTO } from '../../domain/models/session';

export const sessionRepository = {
    async create(dto: CreateSessionDTO): Promise<Session> {
        const now = new Date().toISOString();
        const record: Session = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            name: dto.name,
            date: dto.date,
            discipline: dto.discipline,
            totalDuration: dto.totalDuration,
            totalDistance: dto.totalDistance,
            note: dto.note,
            steps: dto.steps,
        };
        await db.sessions.add(record);
        return record;
    },

    async getById(id: string): Promise<Session | undefined> {
        return db.sessions.get(id);
    },

    async listByDateRange(from: string, to: string): Promise<Session[]> {
        return db.sessions
            .where('date')
            .between(from, to, true, true)
            .toArray();
    },

    async listAll(): Promise<Session[]> {
        return db.sessions.orderBy('date').toArray();
    },

    async update(id: string, dto: UpdateSessionDTO): Promise<Session> {
        const now = new Date().toISOString();
        await db.sessions.update(id, {
            name: dto.name,
            date: dto.date,
            discipline: dto.discipline,
            totalDuration: dto.totalDuration,
            totalDistance: dto.totalDistance,
            note: dto.note,
            steps: dto.steps,
            updatedAt: now,
        });
        const updated = await db.sessions.get(id);
        return updated!;
    },

    async delete(id: string): Promise<void> {
        await db.sessions.delete(id);
    },
};
