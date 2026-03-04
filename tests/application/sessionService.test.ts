import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session, CreateSessionDTO, UpdateSessionDTO } from '@/domain/models/session';

vi.mock('@/persistence/repositories/sessionRepository', () => ({
    sessionRepository: {
        create: vi.fn(),
        getById: vi.fn(),
        listByDateRange: vi.fn(),
        listAll: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

import { sessionService } from '@/application/sessionService';
import { sessionRepository } from '@/persistence/repositories/sessionRepository';

const mockedRepo = vi.mocked(sessionRepository);

const mockSession: Session = {
    id: '1',
    createdAt: '2026-03-04T00:00:00Z',
    updatedAt: '2026-03-04T00:00:00Z',
    name: 'Morning Run',
    date: '2026-03-04',
    discipline: 'run',
    totalDuration: 60,
    totalDistance: 10,
};

const validDTO: CreateSessionDTO = {
    name: 'Morning Run',
    date: '2026-03-04',
    discipline: 'run',
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('sessionService.create', () => {
    it('returns ok on valid input', async () => {
        mockedRepo.create.mockResolvedValue(mockSession);
        const result = await sessionService.create(validDTO);
        expect(result).toEqual({ ok: true, data: mockSession });
    });

    it('returns error on validation failure', async () => {
        const result = await sessionService.create({ ...validDTO, name: '' });
        expect(result.ok).toBe(false);
        expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('returns error when repository throws', async () => {
        mockedRepo.create.mockRejectedValue(new Error('fail'));
        const result = await sessionService.create(validDTO);
        expect(result).toEqual({ ok: false, error: 'Failed to save session' });
    });
});

describe('sessionService.getById', () => {
    it('returns ok with session', async () => {
        mockedRepo.getById.mockResolvedValue(mockSession);
        const result = await sessionService.getById('1');
        expect(result).toEqual({ ok: true, data: mockSession });
    });

    it('returns ok with null when not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await sessionService.getById('999');
        expect(result).toEqual({ ok: true, data: null });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getById.mockRejectedValue(new Error('fail'));
        const result = await sessionService.getById('1');
        expect(result.ok).toBe(false);
    });
});

describe('sessionService.listByDateRange', () => {
    it('returns ok with sessions', async () => {
        mockedRepo.listByDateRange.mockResolvedValue([mockSession]);
        const result = await sessionService.listByDateRange('2026-03-01', '2026-03-31');
        expect(result).toEqual({ ok: true, data: [mockSession] });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.listByDateRange.mockRejectedValue(new Error('fail'));
        const result = await sessionService.listByDateRange('2026-03-01', '2026-03-31');
        expect(result.ok).toBe(false);
    });
});

describe('sessionService.listAll', () => {
    it('returns ok with all sessions', async () => {
        mockedRepo.listAll.mockResolvedValue([mockSession]);
        const result = await sessionService.listAll();
        expect(result).toEqual({ ok: true, data: [mockSession] });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.listAll.mockRejectedValue(new Error('fail'));
        const result = await sessionService.listAll();
        expect(result.ok).toBe(false);
    });
});

describe('sessionService.update', () => {
    const updateDTO: UpdateSessionDTO = { ...validDTO, name: 'Evening Run' };

    it('returns ok with updated session', async () => {
        const updated = { ...mockSession, name: 'Evening Run' };
        mockedRepo.getById.mockResolvedValue(mockSession);
        mockedRepo.update.mockResolvedValue(updated);
        const result = await sessionService.update('1', updateDTO);
        expect(result).toEqual({ ok: true, data: updated });
    });

    it('returns error on validation failure', async () => {
        const result = await sessionService.update('1', { ...updateDTO, name: '' });
        expect(result.ok).toBe(false);
        expect(mockedRepo.getById).not.toHaveBeenCalled();
    });

    it('returns error when session not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await sessionService.update('999', updateDTO);
        expect(result).toEqual({ ok: false, error: 'Session not found' });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getById.mockRejectedValue(new Error('fail'));
        const result = await sessionService.update('1', updateDTO);
        expect(result.ok).toBe(false);
    });
});

describe('sessionService.delete', () => {
    it('returns ok on success', async () => {
        mockedRepo.getById.mockResolvedValue(mockSession);
        mockedRepo.delete.mockResolvedValue(undefined);
        const result = await sessionService.delete('1');
        expect(result).toEqual({ ok: true, data: undefined });
    });

    it('returns error when session not found', async () => {
        mockedRepo.getById.mockResolvedValue(undefined);
        const result = await sessionService.delete('999');
        expect(result).toEqual({ ok: false, error: 'Session not found' });
    });

    it('returns error when repository throws', async () => {
        mockedRepo.getById.mockRejectedValue(new Error('fail'));
        const result = await sessionService.delete('1');
        expect(result.ok).toBe(false);
    });
});
