import { thresholdRepository } from '../persistence/repositories/thresholdRepository';
import { validateThreshold } from '../domain/rules/validateThreshold';
import type { Threshold, CreateThresholdDTO, UpdateThresholdDTO } from '../domain/models/threshold';
import type { Discipline, Metric } from '../domain/types';
import type { Result } from '../domain/entities';

export const thresholdService = {
    async create(dto: CreateThresholdDTO): Promise<Result<Threshold>> {
        const errors = validateThreshold(dto);
        if (errors) {
            const messages = [errors.discipline, errors.metric, errors.value]
                .filter(Boolean)
                .join(', ');
            return { ok: false, error: messages };
        }
        try {
            const existing = await thresholdRepository.getActive(dto.discipline, dto.metric);
            if (existing) {
                return {
                    ok: false,
                    error: `An active threshold for ${dto.discipline}/${dto.metric} already exists. Update the existing one instead.`,
                };
            }
            const record = await thresholdRepository.create(dto);
            return { ok: true, data: record };
        } catch {
            return { ok: false, error: 'Failed to save threshold' };
        }
    },

    async getActive(discipline: Discipline, metric: Metric): Promise<Result<Threshold | null>> {
        try {
            const record = await thresholdRepository.getActive(discipline, metric);
            return { ok: true, data: record ?? null };
        } catch {
            return { ok: false, error: 'Failed to load threshold' };
        }
    },

    async listActive(): Promise<Result<Threshold[]>> {
        try {
            const records = await thresholdRepository.listActive();
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load thresholds' };
        }
    },

    async getHistory(discipline: Discipline, metric: Metric): Promise<Result<Threshold[]>> {
        try {
            const records = await thresholdRepository.getHistory(discipline, metric);
            return { ok: true, data: records };
        } catch {
            return { ok: false, error: 'Failed to load threshold history' };
        }
    },

    async update(
        discipline: Discipline,
        metric: Metric,
        dto: UpdateThresholdDTO,
    ): Promise<Result<Threshold>> {
        const validationInput: CreateThresholdDTO = { discipline, metric, value: dto.value };
        const errors = validateThreshold(validationInput);
        if (errors) {
            const messages = [errors.value].filter(Boolean).join(', ');
            return { ok: false, error: messages };
        }
        try {
            const current = await thresholdRepository.getActive(discipline, metric);
            if (!current) {
                return { ok: false, error: 'No active threshold found for this discipline/metric' };
            }
            const updated = await thresholdRepository.update(current, dto);
            return { ok: true, data: updated };
        } catch {
            return { ok: false, error: 'Failed to update threshold' };
        }
    },

    async delete(discipline: Discipline, metric: Metric): Promise<Result<void>> {
        try {
            const current = await thresholdRepository.getActive(discipline, metric);
            if (!current) {
                return { ok: false, error: 'No active threshold found' };
            }
            await thresholdRepository.softDelete(current.id);
            return { ok: true, data: undefined };
        } catch {
            return { ok: false, error: 'Failed to delete threshold' };
        }
    },
};
