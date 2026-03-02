import { athleteRepository } from '../persistence/repositories/athleteRepository';
import { validateAthlete } from '../domain/rules/validateAthlete';
import type { Athlete, CreateAthleteDTO, UpdateAthleteDTO } from '../domain/models/athlete';
import type { Result } from '../domain/entities';

export const athleteService = {
    async create(dto: CreateAthleteDTO): Promise<Result<Athlete>> {
        const errors = validateAthlete(dto);
        if (errors) {
            return { ok: false, error: Object.values(errors).join(', ') };
        }
        try {
            const athlete = await athleteRepository.create(dto);
            return { ok: true, data: athlete };
        } catch {
            return { ok: false, error: 'Failed to save athlete' };
        }
    },

    async getActive(): Promise<Result<Athlete | null>> {
        try {
            const athlete = await athleteRepository.getActive();
            return { ok: true, data: athlete ?? null };
        } catch {
            return { ok: false, error: 'Failed to load athlete' };
        }
    },

    async update(dto: UpdateAthleteDTO): Promise<Result<Athlete>> {
        try {
            const current = await athleteRepository.getActive();
            if (!current) {
                return { ok: false, error: 'No active athlete found' };
            }
            const updated = await athleteRepository.update(current, dto);
            return { ok: true, data: updated };
        } catch {
            return { ok: false, error: 'Failed to update athlete' };
        }
    },

    async getHistory(): Promise<Result<Athlete[]>> {
        try {
            const history = await athleteRepository.getHistory();
            return { ok: true, data: history };
        } catch {
            return { ok: false, error: 'Failed to load athlete history' };
        }
    },
};
