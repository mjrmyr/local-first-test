import { describe, it, expect } from 'vitest';
import { validateTrainingZones } from '@/domain/rules/validateTrainingZones';
import type { CreateTrainingZonesDTO } from '@/domain/models/trainingZone';

const hrZones: CreateTrainingZonesDTO = {
    discipline: 'run',
    metric: 'hr',
    zones: [
        { name: 'Z1', min: 100, max: 120 },
        { name: 'Z2', min: 120, max: 140 },
        { name: 'Z3', min: 140, max: 160 },
    ],
};

const paceZones: CreateTrainingZonesDTO = {
    discipline: 'run',
    metric: 'pace',
    zones: [
        { name: 'Easy', min: 360, max: 330 },    // slower to faster (higher sec = slower)
        { name: 'Tempo', min: 330, max: 300 },
        { name: 'Threshold', min: 300, max: 270 },
    ],
};

describe('validateTrainingZones', () => {
    it('returns null for valid HR zones', () => {
        expect(validateTrainingZones(hrZones)).toBeNull();
    });

    it('returns null for valid pace zones', () => {
        expect(validateTrainingZones(paceZones)).toBeNull();
    });

    it('requires discipline', () => {
        expect(validateTrainingZones({ ...hrZones, discipline: '' as any })?.discipline).toBe('Discipline is required');
    });

    it('requires metric', () => {
        expect(validateTrainingZones({ ...hrZones, metric: '' as any })?.metric).toBe('Metric is required');
    });

    it('requires at least one zone', () => {
        expect(validateTrainingZones({ ...hrZones, zones: [] })?.zones).toBe('At least one zone is required');
    });

    it('returns early when zones array is empty', () => {
        const result = validateTrainingZones({ ...hrZones, zones: [] });
        expect(result?.zones).toBeDefined();
        expect(result?.zoneErrors).toBeUndefined();
    });

    it('requires zone name', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [{ name: '', min: 100, max: 120 }],
        });
        expect(result?.zoneErrors?.[0]?.name).toBe('Name is required');
    });

    it('requires zone min', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [{ name: 'Z1', min: undefined as any, max: 120 }],
        });
        expect(result?.zoneErrors?.[0]?.min).toBe('Min is required');
    });

    it('requires zone max', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [{ name: 'Z1', min: 100, max: NaN }],
        });
        expect(result?.zoneErrors?.[0]?.max).toBe('Max is required');
    });

    it('rejects HR zone where min >= max', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [{ name: 'Z1', min: 150, max: 100 }],
        });
        expect(result?.zoneErrors?.[0]?.min).toBe('Min must be less than max');
    });

    it('rejects HR zone where min equals max', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [{ name: 'Z1', min: 120, max: 120 }],
        });
        expect(result?.zoneErrors?.[0]?.min).toBeDefined();
    });

    it('rejects pace zone where min <= max (slow end must be > fast end)', () => {
        const result = validateTrainingZones({
            ...paceZones,
            zones: [{ name: 'Easy', min: 300, max: 330 }],
        });
        expect(result?.zoneErrors?.[0]?.min).toBe('For pace, min (slow end) must be greater than max (fast end)');
    });

    it('detects out-of-order HR zones', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [
                { name: 'Z1', min: 100, max: 120 },
                { name: 'Z2', min: 110, max: 140 }, // min < previous max
            ],
        });
        expect(result?.zones).toContain('Zone 2 min must be');
    });

    it('detects out-of-order pace zones', () => {
        const result = validateTrainingZones({
            ...paceZones,
            zones: [
                { name: 'Easy', min: 360, max: 330 },
                { name: 'Tempo', min: 340, max: 300 }, // min > previous max (wrong direction for pace)
            ],
        });
        expect(result?.zones).toContain('Zone 2 min must be');
    });

    it('accepts single zone', () => {
        expect(validateTrainingZones({
            ...hrZones,
            zones: [{ name: 'Z1', min: 100, max: 200 }],
        })).toBeNull();
    });

    it('returns zone-level errors before ordering errors', () => {
        const result = validateTrainingZones({
            ...hrZones,
            zones: [
                { name: '', min: 100, max: 120 },
                { name: 'Z2', min: 110, max: 140 },
            ],
        });
        expect(result?.zoneErrors).toBeDefined();
        expect(result?.zones).toBeUndefined(); // ordering not checked when zone errors exist
    });
});
