import { workoutRepository } from '../persistence/repositories/workoutRepository';
import { validateWorkout } from '../domain/rules/validateWorkout';
import type { Workout, CreateWorkoutDTO, UpdateWorkoutDTO } from '../domain/models/workout';
import type { Discipline } from '../domain/types';
import type { Result } from '../domain/entities';

export const workoutService = {
    async create(dto: CreateWorkoutDTO): Promise<Result<Workout>> {
        const errors = validateWorkout(dto);
        if (errors) {
            const messages = [errors.name, errors.discipline, errors.totalDuration, errors.totalDistance, errors.steps]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages || 'Invalid workout' };
        }
        try {
            const record = await workoutRepository.create(dto);
            return { ok: true, data: record };
        } catch {
            return { ok: false, error: 'Failed to save workout' };
        }
    },

    async getById(id: string): Promise<Result<Workout | null>> {
        try {
            const record = await workoutRepository.getById(id);
            return { ok: true, data: record ?? null };
        } catch {
            return { ok: false, error: 'Failed to load workout' };
        }
    },

    async listAll(): Promise<Result<Workout[]>> {
        try {
            const records = await workoutRepository.listAll();
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load workouts' };
        }
    },

    async listByDiscipline(discipline: Discipline): Promise<Result<Workout[]>> {
        try {
            const records = await workoutRepository.listByDiscipline(discipline);
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load workouts' };
        }
    },

    async update(id: string, dto: UpdateWorkoutDTO): Promise<Result<Workout>> {
        const errors = validateWorkout(dto);
        if (errors) {
            const messages = [errors.name, errors.discipline, errors.totalDuration, errors.totalDistance, errors.steps]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages || 'Invalid workout' };
        }
        try {
            const existing = await workoutRepository.getById(id);
            if (!existing) {
                return { ok: false, error: 'Workout not found' };
            }
            const updated = await workoutRepository.update(id, dto);
            return { ok: true, data: updated };
        } catch {
            return { ok: false, error: 'Failed to update workout' };
        }
    },

    async delete(id: string): Promise<Result<void>> {
        try {
            const existing = await workoutRepository.getById(id);
            if (!existing) {
                return { ok: false, error: 'Workout not found' };
            }
            await workoutRepository.delete(id);
            return { ok: true, data: undefined };
        } catch {
            return { ok: false, error: 'Failed to delete workout' };
        }
    },
};
