import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Athlete, CreateAthleteDTO, UpdateAthleteDTO } from '@/domain/models/athlete';

// Mock the repository
vi.mock('@/persistence/repositories/athleteRepository', () => ({
    athleteRepository: {
        create: vi.fn(),
        getActive: vi.fn(),
        update: vi.fn(),
        getHistory: vi.fn(),
    },
}));

import { athleteService } from '@/application/athleteService';
import { athleteRepository } from '@/persistence/repositories/athleteRepository';

const mockedRepo = vi.mocked(athleteRepository);

const mockAthlete: Athlete = {
    id: '1',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-04T00:00:00Z',
    deleted: 0,
    name: 'John',
    gender: 'male',
    birthday: '1990-01-01',
    weight: 75,
    height: 180,
};

const validDTO: CreateAthleteDTO = {
    name: 'John',
    gender: 'male',
    birthday: '1990-01-01',
    weight: 75,
    height: 180,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('athleteService.create', () => {
    it('returns ok with created athlete on valid input', async () => {
        mockedRepo.create.mockResolvedValue(mockAthlete);
        const result = await athleteService.create(validDTO);
        expect(result).toEqual({ ok: true, data: mockAthlete });
        expect(mockedRepo.create).toHaveBeenCalledWith(validDTO);
    });

    it('returns error on validation failure', async () => {
        const result = await athleteService.create({ ...validDTO, name: '' });
        expect(result.ok).toBe(false);
        expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when repository throws', async () => {
        mockedRepo.create.mockRejectedValue(new Error('DB error'));
        const result = await athleteService.create(validDTO);
        expect(result).toEqual({ ok: false, error: 'Failed to save athlete' });
    });
});

describe('athleteService.getActive', () => {
    it('returns ok with athlete', async () => {
        mockedRepo.getActive.mockResolvedValue(mockAthlete);
        const result = await athleteService.getActive();
        expect(result).toEqual({ ok: true, data: mockAthlete });
    });

    it('returns ok with null when no active athlete', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        const result = await athleteService.getActive();
        expect(result).toEqual({ ok: true, data: null });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getActive.mockRejectedValue(new Error('fail'));
        const result = await athleteService.getActive();
        expect(result.ok).toBe(false);
    });
});

describe('athleteService.update', () => {
    const updateDTO: UpdateAthleteDTO = { name: 'Jane' };

    it('returns ok with updated athlete', async () => {
        const updated = { ...mockAthlete, name: 'Jane' };
        mockedRepo.getActive.mockResolvedValue(mockAthlete);
        mockedRepo.update.mockResolvedValue(updated);
        const result = await athleteService.update(updateDTO);
        expect(result).toEqual({ ok: true, data: updated });
    });

    it('returns error when no active athlete', async () => {
        mockedRepo.getActive.mockResolvedValue(undefined as any);
        const result = await athleteService.update(updateDTO);
        expect(result).toEqual({ ok: false, error: 'No active athlete found' });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getActive.mockRejectedValue(new Error('fail'));
        const result = await athleteService.update(updateDTO);
        expect(result.ok).toBe(false);
    });
});

describe('athleteService.getHistory', () => {
    it('returns ok with history array', async () => {
        mockedRepo.getHistory.mockResolvedValue([mockAthlete]);
        const result = await athleteService.getHistory();
        expect(result).toEqual({ ok: true, data: [mockAthlete] });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getHistory.mockRejectedValue(new Error('fail'));
        const result = await athleteService.getHistory();
        expect(result.ok).toBe(false);
    });
});
