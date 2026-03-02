import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trainingZoneService } from '../../application/trainingZoneService';
import type { TrainingZone } from '../../domain/models/trainingZone';
import type { Discipline, Metric } from '../../domain/types';
import type { ZoneRowErrors } from '../../domain/rules/validateTrainingZones';
import { validateTrainingZones } from '../../domain/rules/validateTrainingZones';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';

// Valid discipline/metric combinations per spec
const VALID_METRICS: Record<Discipline, Metric[]> = {
    swim: ['pace'],
    bike: ['power', 'hr'],
    run: ['pace', 'hr'],
};

const DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
    { value: 'swim', label: 'Swimming' },
    { value: 'bike', label: 'Cycling' },
    { value: 'run', label: 'Running' },
];

const METRIC_LABELS: Record<Metric, string> = {
    hr: 'Heart Rate (bpm)',
    pace: 'Pace (min/km)',
    power: 'Power (watts)',
};

// Pace format helpers (seconds ↔ mm:ss)
function formatPace(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function parsePace(value: string): number {
    const parts = value.split(':');
    if (parts.length !== 2) return NaN;
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (isNaN(m) || isNaN(s)) return NaN;
    return m * 60 + s;
}

// Zone row as string values for form state
interface ZoneRow {
    name: string;
    min: string;
    max: string;
}

function toZoneRow(zone: TrainingZone, metric: Metric): ZoneRow {
    const fmt = (v: number) => (metric === 'pace' ? formatPace(v) : String(v));
    return { name: zone.name, min: fmt(zone.min), max: fmt(zone.max) };
}

function parseZoneValue(value: string, metric: Metric): number {
    if (metric === 'pace') return parsePace(value);
    return Number(value);
}

function zoneRowToZone(row: ZoneRow, metric: Metric): TrainingZone {
    return {
        name: row.name.trim(),
        min: parseZoneValue(row.min, metric),
        max: parseZoneValue(row.max, metric),
    };
}

export function TrainingZoneEditorPage() {
    const navigate = useNavigate();
    const { discipline: paramDiscipline, metric: paramMetric } = useParams<{
        discipline: Discipline;
        metric: Metric;
    }>();

    const isEditing = paramDiscipline !== undefined && paramMetric !== undefined;

    const [discipline, setDiscipline] = useState<Discipline | ''>(paramDiscipline ?? '');
    const [metric, setMetric] = useState<Metric | ''>(paramMetric ?? '');
    const [rows, setRows] = useState<ZoneRow[]>([{ name: '', min: '', max: '' }]);

    const [disciplineError, setDisciplineError] = useState('');
    const [metricError, setMetricError] = useState('');
    const [zonesError, setZonesError] = useState('');
    const [zoneRowErrors, setZoneRowErrors] = useState<ZoneRowErrors[]>([]);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);

    useEffect(() => {
        if (!isEditing) return;
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
    }, [isEditing, paramDiscipline, paramMetric]);

    const availableMetrics: Metric[] =
        discipline ? VALID_METRICS[discipline as Discipline] : [];

    function handleDisciplineChange(d: Discipline) {
        setDiscipline(d);
        setDisciplineError('');
        // Reset metric if not valid for the new discipline
        const validMetrics = VALID_METRICS[d];
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
                // If switching to/from pace, reformat displayed values
                const prevMetric = metric as Metric;
                const prevMin = parseZoneValue(row.min, prevMetric);
                const prevMax = parseZoneValue(row.max, prevMetric);
                const fmtMin = m === 'pace' ? formatPace(isNaN(prevMin) ? 0 : prevMin) : isNaN(prevMin) ? '' : String(prevMin);
                const fmtMax = m === 'pace' ? formatPace(isNaN(prevMax) ? 0 : prevMax) : isNaN(prevMax) ? '' : String(prevMax);
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
            navigate('/training-zones');
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
    const inputHint = currentMetric === 'pace' ? 'mm:ss per km' : '';

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
                <button
                    onClick={() => navigate('/training-zones')}
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
                        {DISCIPLINE_OPTIONS.map((opt) => (
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
    canRemove,
    onChange,
    onRemove,
}: {
    index: number;
    row: ZoneRow;
    errors?: ZoneRowErrors;
    placeholder: string;
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
                        <Input
                            value={row.min}
                            placeholder={placeholder}
                            onChange={(e) => onChange('min', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Max" error={errors?.max}>
                        <Input
                            value={row.max}
                            placeholder={placeholder}
                            onChange={(e) => onChange('max', e.target.value)}
                        />
                    </FormField>
                </div>
            </div>
        </div>
    );
}
