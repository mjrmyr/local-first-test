import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Workout, CreateWorkoutDTO, UpdateWorkoutDTO, WorkoutStep } from '@/domain/models/workout';

vi.mock('@/persistence/repositories/workoutRepository', () => ({
    workoutRepository: {
        create: vi.fn(),
        getById: vi.fn(),
        listAll: vi.fn(),
        listByDiscipline: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

import { workoutService } from '@/application/workoutService';
import { workoutRepository } from '@/persistence/repositories/workoutRepository';

const mockedRepo = vi.mocked(workoutRepository);

const validStep: WorkoutStep = {
    name: 'Warmup',
    type: 'single',
    metric: 'distance',
    unit: 'kilometers',
    value: 2,
};

const mockWorkout: Workout = {
    id: '1',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-04T00:00:00Z',
    name: 'Tempo Run',
    discipline: 'run',
    steps: [validStep],
};

const validDTO: CreateWorkoutDTO = {
    name: 'Tempo Run',
    discipline: 'run',
    steps: [validStep],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('workoutService.create', () => {
    it('returns ok on valid input', async () => {
        mockedRepo.create.mockResolvedValue(mockWorkout);
        const result = await workoutService.create(validDTO);
        expect(result).toEqual({ ok: true, data: mockWorkout });
    });

    it('returns error on validation failure', async () => {
        const result = await workoutService.create({ ...validDTO, name: '' });
        expect(result.ok).toBe(false);
        expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when repository throws', async () => {
        mockedRepo.create.mockRejectedValue(new Error('fail'));
        const result = await workoutService.create(validDTO);
        expect(result).toEqual({ ok: false, error: 'Failed to save workout' });
    });
});

describe('workoutService.getById', () => {
    it('returns ok with workout', async () => {
        mockedRepo.getById.mockResolvedValue(mockWorkout);
        const result = await workoutService.getById('1');
        expect(result).toEqual({ ok: true, data: mockWorkout });
    });

    it('returns ok with null when not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await workoutService.getById('999');
        expect(result).toEqual({ ok: true, data: null });
    });
});

describe('workoutService.listAll', () => {
    it('returns ok with all workouts', async () => {
        mockedRepo.listAll.mockResolvedValue([mockWorkout]);
        const result = await workoutService.listAll();
        expect(result).toEqual({ ok: true, data: [mockWorkout] });
    });
});

describe('workoutService.listByDiscipline', () => {
    it('returns ok with filtered workouts', async () => {
        mockedRepo.listByDiscipline.mockResolvedValue([mockWorkout]);
        const result = await workoutService.listByDiscipline('run');
        expect(result).toEqual({ ok: true, data: [mockWorkout] });
    });
});

describe('workoutService.update', () => {
    const updateDTO: UpdateWorkoutDTO = { ...validDTO, name: 'Long Run' };

    it('returns ok with updated workout', async () => {
        const updated = { ...mockWorkout, name: 'Long Run' };
        mockedRepo.getById.mockResolvedValue(mockWorkout);
        mockedRepo.update.mockResolvedValue(updated);
        const result = await workoutService.update('1', updateDTO);
        expect(result).toEqual({ ok: true, data: updated });
    });

    it('returns error on validation failure', async () => {
        const result = await workoutService.update('1', { ...updateDTO, name: '' });
        expect(result.ok).toBe(false);
    });

    it('returns error when workout not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await workoutService.update('999', updateDTO);
        expect(result).toEqual({ ok: false, error: 'Workout not found' });
    });
});

describe('workoutService.delete', () => {
    it('returns ok on success', async () => {
        mockedRepo.getById.mockResolvedValue(mockWorkout);
        mockedRepo.delete.mockResolvedValue(undefined);
        const result = await workoutService.delete('1');
        expect(result).toEqual({ ok: true, data: undefined });
    });

    it('returns error when workout not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await workoutService.delete('999');
        expect(result).toEqual({ ok: false, error: 'Workout not found' });
    });
});
