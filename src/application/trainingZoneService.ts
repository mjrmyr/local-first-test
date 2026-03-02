import { trainingZoneRepository } from '../persistence/repositories/trainingZoneRepository';
import { validateTrainingZones } from '../domain/rules/validateTrainingZones';
import type {
    TrainingZones,
    CreateTrainingZonesDTO,
    UpdateTrainingZonesDTO,
} from '../domain/models/trainingZone';
import type { Discipline, Metric } from '../domain/types';
import type { Result } from '../domain/entities';

export const trainingZoneService = {
    async create(dto: CreateTrainingZonesDTO): Promise<Result<TrainingZones>> {
        const errors = validateTrainingZones(dto);
        if (errors) {
            const messages = [
                errors.discipline,
                errors.metric,
                errors.zones,
                ...(errors.zoneErrors?.flatMap((e) =>
                    [e.name, e.min, e.max].filter(Boolean),
                ) ?? []),
            ]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages };
        }
        try {
            const existing = await trainingZoneRepository.getActive(dto.discipline, dto.metric);
            if (existing) {
                return {
                    ok: false,
                    error: `An active zone set for ${dto.discipline}/${dto.metric} already exists. Edit the existing one instead.`,
                };
            }
            const record = await trainingZoneRepository.create(dto);
            return { ok: true, data: record };
        } catch {
            return { ok: false, error: 'Failed to save training zones' };
        }
    },

    async getActive(
        discipline: Discipline,
        metric: Metric,
    ): Promise<Result<TrainingZones | null>> {
        try {
            const record = await trainingZoneRepository.getActive(discipline, metric);
            return { ok: true, data: record ?? null };
        } catch {
            return { ok: false, error: 'Failed to load training zones' };
        }
    },

    async listActive(): Promise<Result<TrainingZones[]>> {
        try {
            const records = await trainingZoneRepository.listActive();
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load training zones' };
        }
    },

    async update(
        discipline: Discipline,
        metric: Metric,
        dto: UpdateTrainingZonesDTO,
    ): Promise<Result<TrainingZones>> {
        const validationInput: CreateTrainingZonesDTO = { discipline, metric, zones: dto.zones };
        const errors = validateTrainingZones(validationInput);
        if (errors) {
            const messages = [
                errors.zones,
                ...(errors.zoneErrors?.flatMap((e) =>
                    [e.name, e.min, e.max].filter(Boolean),
                ) ?? []),
            ]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages };
        }
        try {
            const current = await trainingZoneRepository.getActive(discipline, metric);
            if (!current) {
                return { ok: false, error: 'No active zone set found for this discipline/metric' };
            }
            const updated = await trainingZoneRepository.update(current, dto);
            return { ok: true, data: updated };
        } catch {
            return { ok: false, error: 'Failed to update training zones' };
        }
    },

    async delete(discipline: Discipline, metric: Metric): Promise<Result<void>> {
        try {
            const current = await trainingZoneRepository.getActive(discipline, metric);
            if (!current) {
                return { ok: false, error: 'No active zone set found' };
            }
            await trainingZoneRepository.softDelete(current.id);
            return { ok: true, data: undefined };
        } catch {
            return { ok: false, error: 'Failed to delete training zones' };
        }
    },

    async getHistory(discipline: Discipline, metric: Metric): Promise<Result<TrainingZones[]>> {
        try {
            const records = await trainingZoneRepository.getHistory(discipline, metric);
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load history' };
        }
    },
};
