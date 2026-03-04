import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Threshold, CreateThresholdDTO, UpdateThresholdDTO } from '@/domain/models/threshold';

vi.mock('@/persistence/repositories/thresholdRepository', () => ({
    thresholdRepository: {
        create: vi.fn(),
        getActive: vi.fn(),
        listActive: vi.fn(),
        getHistory: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

import { thresholdService } from '@/application/thresholdService';
import { thresholdRepository } from '@/persistence/repositories/thresholdRepository';

const mockedRepo = vi.mocked(thresholdRepository);

const mockThreshold: Threshold = {
    id: '1',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-04T00:00:00Z',
    deleted: 0,
    discipline: 'run',
    metric: 'pace',
    value: 300,
};

const validDTO: CreateThresholdDTO = {
    discipline: 'run',
    metric: 'pace',
    value: 300,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('thresholdService.create', () => {
    it('returns ok on valid input with no existing threshold', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        mockedRepo.create.mockResolvedValue(mockThreshold);
        const result = await thresholdService.create(validDTO);
        expect(result).toEqual({ ok: true, data: mockThreshold });
    });

    it('returns error on validation failure', async () => {
        const result = await thresholdService.create({ ...validDTO, value: -1 });
        expect(result.ok).toBe(false);
        expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when active threshold already exists', async () => {
        mockedRepo.getActive.mockResolvedValue(mockThreshold);
        const result = await thresholdService.create(validDTO);
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('already exists');
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getActive.mockRejectedValue(new Error('fail'));
        const result = await thresholdService.create(validDTO);
        expect(result).toEqual({ ok: false, error: 'Failed to save threshold' });
    });
});

describe('thresholdService.getActive', () => {
    it('returns ok with threshold', async () => {
        mockedRepo.getActive.mockResolvedValue(mockThreshold);
        const result = await thresholdService.getActive('run', 'pace');
        expect(result).toEqual({ ok: true, data: mockThreshold });
    });

    it('returns ok with null when not found', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        const result = await thresholdService.getActive('run', 'pace');
        expect(result).toEqual({ ok: true, data: null });
    });
});

describe('thresholdService.listActive', () => {
    it('returns ok with active thresholds', async () => {
        mockedRepo.listActive.mockResolvedValue([mockThreshold]);
        const result = await thresholdService.listActive();
        expect(result).toEqual({ ok: true, data: [mockThreshold] });
    });
});

describe('thresholdService.getHistory', () => {
    it('returns ok with history', async () => {
        mockedRepo.getHistory.mockResolvedValue([mockThreshold]);
        const result = await thresholdService.getHistory('run', 'pace');
        expect(result).toEqual({ ok: true, data: [mockThreshold] });
    });
});

describe('thresholdService.update', () => {
    const updateDTO: UpdateThresholdDTO = { value: 290 };

    it('returns ok with updated threshold', async () => {
        const updated = { ...mockThreshold, value: 290 };
        mockedRepo.getActive.mockResolvedValue(mockThreshold);
        mockedRepo.update.mockResolvedValue(updated);
        const result = await thresholdService.update('run', 'pace', updateDTO);
        expect(result).toEqual({ ok: true, data: updated });
    });

    it('returns error on invalid value', async () => {
        const result = await thresholdService.update('run', 'pace', { value: -1 });
        expect(result.ok).toBe(false);
    });

    it('returns error when no active threshold', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        const result = await thresholdService.update('run', 'pace', updateDTO);
        expect(result).toEqual({ ok: false, error: 'No active threshold found for this discipline/metric' });
    });
});

describe('thresholdService.delete', () => {
    it('returns ok on success', async () => {
        mockedRepo.getActive.mockResolvedValue(mockThreshold);
        mockedRepo.softDelete.mockResolvedValue(undefined as any);
        const result = await thresholdService.delete('run', 'pace');
        expect(result).toEqual({ ok: true, data: undefined });
    });

    it('returns error when no active threshold', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        const result = await thresholdService.delete('run', 'pace');
        expect(result).toEqual({ ok: false, error: 'No active threshold found' });
    });
});
