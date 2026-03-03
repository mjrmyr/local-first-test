import { sessionRepository } from '../persistence/repositories/sessionRepository';
import { validateSession } from '../domain/rules/validateSession';
import type { Session, CreateSessionDTO, UpdateSessionDTO } from '../domain/models/session';
import type { Result } from '../domain/entities';

export const sessionService = {
    async create(dto: CreateSessionDTO): Promise<Result<Session>> {
        const errors = validateSession(dto);
        if (errors) {
            const messages = [errors.name, errors.date, errors.discipline, errors.totalDuration, errors.totalDistance]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages || 'Invalid session' };
        }
        try {
            const record = await sessionRepository.create(dto);
            return { ok: true, data: record };
        } catch {
            return { ok: false, error: 'Failed to save session' };
        }
    },

    async getById(id: string): Promise<Result<Session | null>> {
        try {
            const record = await sessionRepository.getById(id);
            return { ok: true, data: record ?? null };
        } catch {
            return { ok: false, error: 'Failed to load session' };
        }
    },

    async listByDateRange(from: string, to: string): Promise<Result<Session[]>> {
        try {
            const records = await sessionRepository.listByDateRange(from, to);
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load sessions' };
        }
    },

    async listAll(): Promise<Result<Session[]>> {
        try {
            const records = await sessionRepository.listAll();
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load sessions' };
        }
    },

    async update(id: string, dto: UpdateSessionDTO): Promise<Result<Session>> {
        const errors = validateSession(dto);
        if (errors) {
            const messages = [errors.name, errors.date, errors.discipline, errors.totalDuration, errors.totalDistance]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages || 'Invalid session' };
        }
        try {
            const existing = await sessionRepository.getById(id);
            if (!existing) {
                return { ok: false, error: 'Session not found' };
            }
            const updated = await sessionRepository.update(id, dto);
            return { ok: true, data: updated };
        } catch {
            return { ok: false, error: 'Failed to update session' };
        }
    },

    async delete(id: string): Promise<Result<void>> {
        try {
            const existing = await sessionRepository.getById(id);
            if (!existing) {
                return { ok: false, error: 'Session not found' };
            }
            await sessionRepository.delete(id);
            return { ok: true, data: undefined };
        } catch {
            return { ok: false, error: 'Failed to delete session' };
        }
    },
};
