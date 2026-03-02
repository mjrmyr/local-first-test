import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Athlete, CreateAthleteDTO, UpdateAthleteDTO } from '../../domain/models/athlete';

export const athleteRepository = {
    async create(dto: CreateAthleteDTO): Promise<Athlete> {
        const now = new Date().toISOString();
        const athlete: Athlete = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            deleted: 0,
            ...dto,
        };
        await db.athletes.add(athlete);
        return athlete;
    },

    async getActive(): Promise<Athlete | undefined> {
        return db.athletes.where('deleted').equals(0).first();
    },

    async getHistory(): Promise<Athlete[]> {
        return db.athletes.orderBy('updatedAt').toArray();
    },

    async update(current: Athlete, dto: UpdateAthleteDTO): Promise<Athlete> {
        const now = new Date().toISOString();
        const weightChanged = dto.weight !== undefined && dto.weight !== current.weight;

        if (weightChanged) {
            // Tombstone pattern: soft-delete current record, insert new one to preserve weight history
            await db.athletes.update(current.id, { deleted: 1 });
            const newAthlete: Athlete = {
                id: uuidv4(),
                createdAt: current.createdAt,
                updatedAt: now,
                deleted: 0,
                name: dto.name ?? current.name,
                gender: dto.gender ?? current.gender,
                birthday: dto.birthday ?? current.birthday,
                weight: dto.weight,
                height: dto.height !== undefined ? dto.height : current.height,
            };
            await db.athletes.add(newAthlete);
            return newAthlete;
        }

        // Non-weight changes: update the existing record in-place
        const patch: Partial<Athlete> = {
            updatedAt: now,
            name: dto.name ?? current.name,
            gender: dto.gender ?? current.gender,
            birthday: dto.birthday ?? current.birthday,
            height: dto.height !== undefined ? dto.height : current.height,
        };
        await db.athletes.update(current.id, patch);
        return { ...current, ...patch };
    },
};
