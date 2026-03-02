import { useEffect, useState } from 'react';
import { trainingZoneService } from '../../application/trainingZoneService';
import { VALID_ZONE_COMBINATIONS, type TrainingZone } from '../../domain/models/trainingZone';
import type { Discipline, Metric } from '../../domain/types';
import type { ZoneRowErrors } from '../../domain/rules/validateTrainingZones';
import { validateTrainingZones } from '../../domain/rules/validateTrainingZones';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';
import { PaceInput } from '../components/PaceInput';
import { formatSecondsToMmSs, parseMmSsToSeconds } from '@/helpers/pace';

const ALL_DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
    { value: 'swim', label: 'Swimming' },
    { value: 'bike', label: 'Cycling' },
    { value: 'run', label: 'Running' },
];

const METRIC_LABELS: Record<Metric, string> = {
    hr: 'Heart Rate (bpm)',
    pace: 'Pace (min/km)',
    power: 'Power (watts)',
};

// Zone row as string values for form state
interface ZoneRow {
    name: string;
    min: string;
    max: string;
}

function toZoneRow(zone: TrainingZone, metric: Metric): ZoneRow {
    const fmt = (v: number) => (metric === 'pace' ? formatSecondsToMmSs(v) : String(v));
    return { name: zone.name, min: fmt(zone.min), max: fmt(zone.max) };
}

function parseZoneValue(value: string, metric: Metric): number {
    if (metric === 'pace') return parseMmSsToSeconds(value) ?? NaN;
    return Number(value);
}

function zoneRowToZone(row: ZoneRow, metric: Metric): TrainingZone {
    return {
        name: row.name.trim(),
        min: parseZoneValue(row.min, metric),
        max: parseZoneValue(row.max, metric),
    };
}

interface Props {
    isEditing: boolean;
    discipline?: Discipline;
    metric?: Metric;
    onBack: () => void;
    onSave: () => void;
}

export function TrainingZoneEditorPage({ isEditing, discipline: paramDiscipline, metric: paramMetric, onBack, onSave }: Props) {
    const [discipline, setDiscipline] = useState<Discipline | ''>(paramDiscipline ?? '');
    const [metric, setMetric] = useState<Metric | ''>(paramMetric ?? '');
    const [rows, setRows] = useState<ZoneRow[]>([{ name: '', min: '', max: '' }]);

    const [disciplineError, setDisciplineError] = useState('');
    const [metricError, setMetricError] = useState('');
    const [zonesError, setZonesError] = useState('');
    const [zoneRowErrors, setZoneRowErrors] = useState<ZoneRowErrors[]>([]);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [configuredCombinations, setConfiguredCombinations] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isEditing) {
            trainingZoneService
                .getActive(paramDiscipline as Discipline, paramMetric as Metric)
                .then((result) => {
                    if (result.ok && result.data) {
                        setRows(
                            result.data.zones.map((z) =>
                                toZoneRow(z, paramMetric as Metric),
                            ),
                        );
                    } else {
                        setSubmitError('Failed to load zone set');
                    }
                    setLoading(false);
                });
        } else {
            trainingZoneService.listActive().then((result) => {
                if (result.ok) {
                    setConfiguredCombinations(
                        new Set(result.data.map((z) => `${z.discipline}/${z.metric}`)),
                    );
                }
                setLoading(false);
            });
        }
    }, [isEditing, paramDiscipline, paramMetric]);

    const availableDisciplines = isEditing
        ? ALL_DISCIPLINE_OPTIONS
        : ALL_DISCIPLINE_OPTIONS.filter((opt) =>
              VALID_ZONE_COMBINATIONS[opt.value].some(
                  (m) => !configuredCombinations.has(`${opt.value}/${m}`),
              ),
          );

    const availableMetrics: Metric[] = discipline
        ? VALID_ZONE_COMBINATIONS[discipline as Discipline].filter(
              (m) => !configuredCombinations.has(`${discipline}/${m}`),
          )
        : [];

    function handleDisciplineChange(d: Discipline) {
        setDiscipline(d);
        setDisciplineError('');
        const validMetrics = VALID_ZONE_COMBINATIONS[d];
        if (metric && !validMetrics.includes(metric as Metric)) {
            setMetric('');
        }
    }

    function handleMetricChange(m: Metric) {
        setMetric(m);
        setMetricError('');
        // Reformat zone values for the new metric
        setRows((prev) =>
            prev.map((row) => {
                if (!row.min && !row.max) return row;
                const prevMetric = metric as Metric;
                const prevMin = parseZoneValue(row.min, prevMetric);
                const prevMax = parseZoneValue(row.max, prevMetric);
                const fmtMin = m === 'pace' ? formatSecondsToMmSs(isNaN(prevMin) ? 0 : prevMin) : isNaN(prevMin) ? '' : String(prevMin);
                const fmtMax = m === 'pace' ? formatSecondsToMmSs(isNaN(prevMax) ? 0 : prevMax) : isNaN(prevMax) ? '' : String(prevMax);
                return { ...row, min: fmtMin, max: fmtMax };
            }),
        );
    }

    function updateRow(index: number, field: keyof ZoneRow, value: string) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
        // Clear that row's error
        setZoneRowErrors((prev) =>
            prev.map((e, i) => (i === index ? { ...e, [field]: undefined } : e)),
        );
        setZonesError('');
        setSubmitError('');
    }

    function addRow() {
        setRows((prev) => [...prev, { name: '', min: '', max: '' }]);
    }

    function removeRow(index: number) {
        setRows((prev) => prev.filter((_, i) => i !== index));
        setZoneRowErrors((prev) => prev.filter((_, i) => i !== index));
    }

    function clientValidate(): boolean {
        const currentDiscipline = discipline as Discipline;
        const currentMetric = metric as Metric;
        const zones = rows.map((r) => zoneRowToZone(r, currentMetric));
        const result = validateTrainingZones({
            discipline: currentDiscipline,
            metric: currentMetric,
            zones,
        });

        if (!result) {
            setDisciplineError('');
            setMetricError('');
            setZonesError('');
            setZoneRowErrors([]);
            return true;
        }

        setDisciplineError(result.discipline ?? '');
        setMetricError(result.metric ?? '');
        setZonesError(result.zones ?? '');
        setZoneRowErrors(result.zoneErrors ?? []);
        return false;
    }

    async function handleSave() {
        if (!clientValidate()) return;

        setSubmitting(true);
        setSubmitError('');

        const currentDiscipline = discipline as Discipline;
        const currentMetric = metric as Metric;
        const zones = rows.map((r) => zoneRowToZone(r, currentMetric));

        const result = isEditing
            ? await trainingZoneService.update(currentDiscipline, currentMetric, { zones })
            : await trainingZoneService.create({ discipline: currentDiscipline, metric: currentMetric, zones });

        setSubmitting(false);

        if (result.ok) {
            onSave();
        } else {
            setSubmitError(result.error);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fff4e1]">
                <span className="text-gray-400">Loading…</span>
            </div>
        );
    }

    const currentMetric = metric as Metric;
    const inputPlaceholder = currentMetric === 'pace' ? 'e.g. 5:30' : 'e.g. 100';
    const inputHint = currentMetric === 'pace' ? 'mm:ss per km — Min = slow end, Max = fast end' : '';

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
                <button
                    onClick={onBack}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">
                    {isEditing ? 'Edit Zone Set' : 'New Zone Set'}
                </h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                {/* Discipline selector — locked when editing */}
                <FormField label="Discipline" error={disciplineError}>
                    <div className="flex gap-2">
                        {availableDisciplines.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                disabled={isEditing}
                                onClick={() => handleDisciplineChange(opt.value)}
                                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                    discipline === opt.value
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </FormField>

                {/* Metric selector — locked when editing */}
                {discipline && (
                    <FormField label="Metric" error={metricError}>
                        <div className="flex gap-2">
                            {availableMetrics.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    disabled={isEditing}
                                    onClick={() => handleMetricChange(m)}
                                    className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                        metric === m
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {METRIC_LABELS[m]}
                                </button>
                            ))}
                        </div>
                    </FormField>
                )}

                {/* Zones */}
                {metric && (
                    <>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Zones</span>
                                {inputHint && (
                                    <span className="text-xs text-gray-400">{inputHint}</span>
                                )}
                            </div>

                            {zonesError && (
                                <p className="text-sm text-red-600">{zonesError}</p>
                            )}

                            {rows.map((row, i) => (
                                <ZoneRowEditor
                                    key={i}
                                    index={i}
                                    row={row}
                                    errors={zoneRowErrors[i]}
                                    placeholder={inputPlaceholder}
                                    isPace={currentMetric === 'pace'}
                                    canRemove={rows.length > 1}
                                    onChange={(field, value) => updateRow(i, field, value)}
                                    onRemove={() => removeRow(i)}
                                />
                            ))}

                            <button
                                type="button"
                                onClick={addRow}
                                className="rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors"
                            >
                                + Add Zone
                            </button>
                        </div>

                        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Saving…' : 'Save Zone Set'}
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}

function ZoneRowEditor({
    index,
    row,
    errors,
    placeholder,
    isPace,
    canRemove,
    onChange,
    onRemove,
}: {
    index: number;
    row: ZoneRow;
    errors?: ZoneRowErrors;
    placeholder: string;
    isPace: boolean;
    canRemove: boolean;
    onChange: (field: keyof ZoneRow, value: string) => void;
    onRemove: () => void;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Zone {index + 1}
                </span>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Remove
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <FormField label="Name" error={errors?.name}>
                    <Input
                        value={row.name}
                        placeholder="e.g. Zone 1, Easy, Threshold"
                        onChange={(e) => onChange('name', e.target.value)}
                    />
                </FormField>
                <div className="flex gap-2">
                    <FormField label="Min" error={errors?.min}>
                        {isPace ? (
                            <PaceInput
                                value={row.min}
                                placeholder={placeholder}
                                onChange={(val) => onChange('min', val)}
                            />
                        ) : (
                            <Input
                                value={row.min}
                                placeholder={placeholder}
                                onChange={(e) => onChange('min', e.target.value)}
                            />
                        )}
                    </FormField>
                    <FormField label="Max" error={errors?.max}>
                        {isPace ? (
                            <PaceInput
                                value={row.max}
                                placeholder={placeholder}
                                onChange={(val) => onChange('max', val)}
                            />
                        ) : (
                            <Input
                                value={row.max}
                                placeholder={placeholder}
                                onChange={(e) => onChange('max', e.target.value)}
                            />
                        )}
                    </FormField>
                </div>
            </div>
        </div>
    );
}
