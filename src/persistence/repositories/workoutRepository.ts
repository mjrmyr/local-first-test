import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Workout, CreateWorkoutDTO, UpdateWorkoutDTO } from '../../domain/models/workout';
import type { Discipline } from '../../domain/types';

export const workoutRepository = {
    async create(dto: CreateWorkoutDTO): Promise<Workout> {
        const now = new Date().toISOString();
        const record: Workout = {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            name: dto.name,
            discipline: dto.discipline,
            totalDuration: dto.totalDuration,
            totalDistance: dto.totalDistance,
            notes: dto.notes,
            steps: dto.steps,
        };
        await db.workouts.add(record);
        return record;
    },

    async getById(id: string): Promise<Workout | undefined> {
        return db.workouts.get(id);
    },

    async listAll(): Promise<Workout[]> {
        return db.workouts.toArray();
    },

    async listByDiscipline(discipline: Discipline): Promise<Workout[]> {
        return db.workouts.where('discipline').equals(discipline).toArray();
    },

    async update(id: string, dto: UpdateWorkoutDTO): Promise<Workout> {
        const now = new Date().toISOString();
        await db.workouts.update(id, {
            name: dto.name,
            discipline: dto.discipline,
            totalDuration: dto.totalDuration,
            totalDistance: dto.totalDistance,
            notes: dto.notes,
            steps: dto.steps,
            updatedAt: now,
        });
        const updated = await db.workouts.get(id);
        return updated!;
    },

    async delete(id: string): Promise<void> {
        await db.workouts.delete(id);
    },
};
