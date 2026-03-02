import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { thresholdService } from '../../application/thresholdService';
import { VALID_THRESHOLD_COMBINATIONS } from '../../domain/models/threshold';
import type { Discipline, Metric } from '../../domain/types';
import { validateThreshold } from '../../domain/rules/validateThreshold';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';
import { PaceInput } from '../components/PaceInput';
import { formatSecondsToMmSs, parseMmSsToSeconds } from '@/helpers/pace';

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

function parseValue(raw: string, metric: Metric): number {
    if (metric === 'pace') return parseMmSsToSeconds(raw) ?? NaN;
    return Number(raw);
}

function formatValue(value: number, metric: Metric): string {
    if (metric === 'pace') return formatSecondsToMmSs(value);
    return String(value);
}

export function ThresholdEditorPage() {
    const navigate = useNavigate();
    const { discipline: paramDiscipline, metric: paramMetric } = useParams<{
        discipline: Discipline;
        metric: Metric;
    }>();

    const isEditing = paramDiscipline !== undefined && paramMetric !== undefined;

    const [discipline, setDiscipline] = useState<Discipline | ''>(paramDiscipline ?? '');
    const [metric, setMetric] = useState<Metric | ''>(paramMetric ?? '');
    const [rawValue, setRawValue] = useState('');

    const [disciplineError, setDisciplineError] = useState('');
    const [metricError, setMetricError] = useState('');
    const [valueError, setValueError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [configuredCombinations, setConfiguredCombinations] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isEditing) {
            thresholdService
                .getActive(paramDiscipline as Discipline, paramMetric as Metric)
                .then((result) => {
                    if (result.ok && result.data) {
                        setRawValue(formatValue(result.data.value, paramMetric as Metric));
                    } else {
                        setSubmitError('Failed to load threshold');
                    }
                    setLoading(false);
                });
        } else {
            thresholdService.listActive().then((result) => {
                if (result.ok) {
                    setConfiguredCombinations(
                        new Set(result.data.map((t) => `${t.discipline}/${t.metric}`)),
                    );
                }
                setLoading(false);
            });
        }
    }, [isEditing, paramDiscipline, paramMetric]);

    const availableDisciplines = isEditing
        ? DISCIPLINE_OPTIONS
        : DISCIPLINE_OPTIONS.filter((opt) =>
              VALID_THRESHOLD_COMBINATIONS[opt.value].some(
                  (m) => !configuredCombinations.has(`${opt.value}/${m}`),
              ),
          );

    const availableMetrics: Metric[] = discipline
        ? VALID_THRESHOLD_COMBINATIONS[discipline as Discipline].filter(
              (m) => !configuredCombinations.has(`${discipline}/${m}`),
          )
        : [];

    function handleDisciplineChange(d: Discipline) {
        setDiscipline(d);
        setDisciplineError('');
        const validMetrics = VALID_THRESHOLD_COMBINATIONS[d];
        if (metric && !validMetrics.includes(metric as Metric)) {
            setMetric('');
            setRawValue('');
        }
    }

    function handleMetricChange(m: Metric) {
        setMetric(m);
        setMetricError('');
        setRawValue('');
    }

    function clientValidate(): boolean {
        const currentDiscipline = discipline as Discipline;
        const currentMetric = metric as Metric;
        const value = parseValue(rawValue, currentMetric);
        const result = validateThreshold({
            discipline: currentDiscipline,
            metric: currentMetric,
            value,
        });

        if (!result) {
            setDisciplineError('');
            setMetricError('');
            setValueError('');
            return true;
        }

        setDisciplineError(result.discipline ?? '');
        setMetricError(result.metric ?? '');
        setValueError(result.value ?? '');
        return false;
    }

    async function handleSave() {
        if (!clientValidate()) return;

        setSubmitting(true);
        setSubmitError('');

        const currentDiscipline = discipline as Discipline;
        const currentMetric = metric as Metric;
        const value = parseValue(rawValue, currentMetric);

        const result = isEditing
            ? await thresholdService.update(currentDiscipline, currentMetric, { value })
            : await thresholdService.create({ discipline: currentDiscipline, metric: currentMetric, value });

        setSubmitting(false);

        if (result.ok) {
            navigate('/thresholds');
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
    const valuePlaceholder = currentMetric === 'pace' ? 'e.g. 4:30' : currentMetric === 'power' ? 'e.g. 280' : 'e.g. 165';
    const valueHint = currentMetric === 'pace' ? 'Enter as mm:ss per km' : '';

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
                <button
                    onClick={() => navigate('/thresholds')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">
                    {isEditing ? 'Edit Threshold' : 'New Threshold'}
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

                {/* Value input */}
                {metric && (
                    <>
                        <FormField label="Threshold Value" error={valueError}>
                            {currentMetric === 'pace' ? (
                                <PaceInput
                                    value={rawValue}
                                    placeholder={valuePlaceholder}
                                    onChange={(val) => {
                                        setRawValue(val);
                                        setValueError('');
                                        setSubmitError('');
                                    }}
                                />
                            ) : (
                                <Input
                                    value={rawValue}
                                    placeholder={valuePlaceholder}
                                    onChange={(e) => {
                                        setRawValue(e.target.value);
                                        setValueError('');
                                        setSubmitError('');
                                    }}
                                />
                            )}
                            {valueHint && (
                                <p className="text-xs text-gray-400 mt-0.5">{valueHint}</p>
                            )}
                        </FormField>

                        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Saving…' : 'Save Threshold'}
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}
