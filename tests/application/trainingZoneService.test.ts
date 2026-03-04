import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TrainingZones, CreateTrainingZonesDTO, UpdateTrainingZonesDTO } from '@/domain/models/trainingZone';

vi.mock('@/persistence/repositories/trainingZoneRepository', () => ({
    trainingZoneRepository: {
        create: vi.fn(),
        getActive: vi.fn(),
        listActive: vi.fn(),
        getHistory: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

import { trainingZoneService } from '@/application/trainingZoneService';
import { trainingZoneRepository } from '@/persistence/repositories/trainingZoneRepository';

const mockedRepo = vi.mocked(trainingZoneRepository);

const mockZones: TrainingZones = {
    id: '1',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-04T00:00:00Z',
    deleted: 0,
    discipline: 'run',
    metric: 'hr',
    zones: [
        { name: 'Z1', min: 100, max: 120 },
        { name: 'Z2', min: 120, max: 140 },
    ],
};

const validDTO: CreateTrainingZonesDTO = {
    discipline: 'run',
    metric: 'hr',
    zones: [
        { name: 'Z1', min: 100, max: 120 },
        { name: 'Z2', min: 120, max: 140 },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('trainingZoneService.create', () => {
    it('returns ok on valid input with no existing zones', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined);
        mockedRepo.create.mockResolvedValue(mockZones);
        const result = await trainingZoneService.create(validDTO);
        expect(result).toEqual({ ok: true, data: mockZones });
    });

    it('returns error on validation failure', async () => {
        const result = await trainingZoneService.create({ ...validDTO, zones: [] });
        expect(result.ok).toBe(false);
        expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when active zone set already exists', async () => {
        mockedRepo.getActive.mockResolvedValue(mockZones);
        const result = await trainingZoneService.create(validDTO);
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('already exists');
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getActive.mockRejectedValue(new Error('fail'));
        const result = await trainingZoneService.create(validDTO);
        expect(result).toEqual({ ok: false, error: 'Failed to save training zones' });
    });
});

describe('trainingZoneService.getActive', () => {
    it('returns ok with zones', async () => {
        mockedRepo.getActive.mockResolvedValue(mockZones);
        const result = await trainingZoneService.getActive('run', 'hr');
        expect(result).toEqual({ ok: true, data: mockZones });
    });

    it('returns ok with null when not found', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined);
        const result = await trainingZoneService.getActive('run', 'hr');
        expect(result).toEqual({ ok: true, data: null });
    });
});

describe('trainingZoneService.listActive', () => {
    it('returns ok with active zones', async () => {
        mockedRepo.listActive.mockResolvedValue([mockZones]);
        const result = await trainingZoneService.listActive();
        expect(result).toEqual({ ok: true, data: [mockZones] });
    });
});

describe('trainingZoneService.update', () => {
    const updateDTO: UpdateTrainingZonesDTO = {
        zones: [{ name: 'Z1', min: 100, max: 130 }],
    };

    it('returns ok with updated zones', async () => {
        const updated = { ...mockZones, zones: updateDTO.zones };
        mockedRepo.getActive.mockResolvedValue(mockZones);
        mockedRepo.update.mockResolvedValue(updated);
        const result = await trainingZoneService.update('run', 'hr', updateDTO);
        expect(result).toEqual({ ok: true, data: updated });
    });

    it('returns error on invalid zones', async () => {
        const result = await trainingZoneService.update('run', 'hr', { zones: [] });
        expect(result.ok).toBe(false);
    });

    it('returns error when no active zone set', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined);
        const result = await trainingZoneService.update('run', 'hr', updateDTO);
        expect(result).toEqual({ ok: false, error: 'No active zone set found for this discipline/metric' });
    });
});

describe('trainingZoneService.delete', () => {
    it('returns ok on success', async () => {
        mockedRepo.getActive.mockResolvedValue(mockZones);
        mockedRepo.softDelete.mockResolvedValue(undefined);
        const result = await trainingZoneService.delete('run', 'hr');
        expect(result).toEqual({ ok: true, data: undefined });
    });

    it('returns error when no active zone set', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined);
        const result = await trainingZoneService.delete('run', 'hr');
        expect(result).toEqual({ ok: false, error: 'No active zone set found' });
    });
});

describe('trainingZoneService.getHistory', () => {
    it('returns ok with history', async () => {
        mockedRepo.getHistory.mockResolvedValue([mockZones]);
        const result = await trainingZoneService.getHistory('run', 'hr');
        expect(result).toEqual({ ok: true, data: [mockZones] });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getHistory.mockRejectedValue(new Error('fail'));
        const result = await trainingZoneService.getHistory('run', 'hr');
        expect(result.ok).toBe(false);
    });
});
