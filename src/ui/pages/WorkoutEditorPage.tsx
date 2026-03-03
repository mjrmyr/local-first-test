import { useEffect, useState } from 'react';
import { workoutService } from '../../application/workoutService';
import type { WorkoutStep } from '../../domain/models/workout';
import type { Discipline, WorkoutStepMetric, WorkoutStepType, WorkoutStepUnit } from '../../domain/types';
import { validateWorkout, type StepErrors } from '../../domain/rules/validateWorkout';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Textarea } from '../components/Textarea';

const DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
    { value: 'swim', label: 'Swimming' },
    { value: 'bike', label: 'Cycling' },
    { value: 'run', label: 'Running' },
];

const METRIC_UNITS: Record<WorkoutStepMetric, { value: WorkoutStepUnit; label: string }[]> = {
    distance: [
        { value: 'meters', label: 'Meters' },
        { value: 'kilometers', label: 'Kilometers' },
    ],
    time: [
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' },
    ],
};

function toBaseValue(value: number, unit: WorkoutStepUnit): number {
    switch (unit) {
        case 'kilometers': return value * 1000;
        case 'hours': return value * 3600;
        case 'minutes': return value * 60;
        case 'meters': return value;
    }
}

function fromBaseValue(value: number, unit: WorkoutStepUnit): number {
    switch (unit) {
        case 'kilometers': return value / 1000;
        case 'hours': return value / 3600;
        case 'minutes': return value / 60;
        case 'meters': return value;
    }
}

function emptyStep(): WorkoutStep {
    return { name: '', type: 'single', metric: 'distance', unit: 'meters', value: 0 };
}

export function WorkoutEditorPage({
    id,
    onBack,
    onSave,
}: {
    id?: string;
    onBack: () => void;
    onSave: () => void;
}) {
    const isEditing = !!id;

    const [name, setName] = useState('');
    const [discipline, setDiscipline] = useState<Discipline | ''>('');
    const [totalDuration, setTotalDuration] = useState('');
    const [totalDistance, setTotalDistance] = useState('');
    const [notes, setNotes] = useState('');
    const [steps, setSteps] = useState<WorkoutStep[]>([emptyStep()]);

    const [nameError, setNameError] = useState('');
    const [disciplineError, setDisciplineError] = useState('');
    const [totalDurationError, setTotalDurationError] = useState('');
    const [totalDistanceError, setTotalDistanceError] = useState('');
    const [stepsError, setStepsError] = useState('');
    const [stepErrors, setStepErrors] = useState<StepErrors[]>([]);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);

    useEffect(() => {
        if (!isEditing || !id) return;
        workoutService.getById(id).then((result) => {
            if (result.ok && result.data) {
                const w = result.data;
                setName(w.name);
                setDiscipline(w.discipline);
                setTotalDuration(w.totalDuration ? String(w.totalDuration) : '');
                setTotalDistance(w.totalDistance ? String(w.totalDistance) : '');
                setNotes(w.notes ?? '');
                setSteps(w.steps);
            } else {
                setSubmitError('Failed to load workout');
            }
            setLoading(false);
        });
    }, [isEditing, id]);

    function updateStep(index: number, update: Partial<WorkoutStep>) {
        setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
        // Clear step errors for this index
        setStepErrors((prev) => {
            const next = [...prev];
            if (next[index]) next[index] = {};
            return next;
        });
    }

    function removeStep(index: number) {
        setSteps((prev) => prev.filter((_, i) => i !== index));
    }

    function moveStep(index: number, direction: 'up' | 'down') {
        setSteps((prev) => {
            const next = [...prev];
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function clientValidate(): boolean {
        const dto = buildDTO();
        const result = validateWorkout(dto);

        if (!result) {
            setNameError('');
            setDisciplineError('');
            setTotalDurationError('');
            setTotalDistanceError('');
            setStepsError('');
            setStepErrors([]);
            return true;
        }

        setNameError(result.name ?? '');
        setDisciplineError(result.discipline ?? '');
        setTotalDurationError(result.totalDuration ?? '');
        setTotalDistanceError(result.totalDistance ?? '');
        setStepsError(result.steps ?? '');
        setStepErrors(result.stepErrors ?? []);
        return false;
    }

    function buildDTO() {
        const parsedDuration = totalDuration ? Number(totalDuration) : undefined;
        const parsedDistance = totalDistance ? Number(totalDistance) : undefined;
        return {
            name: name.trim(),
            discipline: discipline as Discipline,
            totalDuration: parsedDuration,
            totalDistance: parsedDistance,
            notes: notes.trim() || undefined,
            steps,
        };
    }

    async function handleSave() {
        if (!clientValidate()) return;

        setSubmitting(true);
        setSubmitError('');

        const dto = buildDTO();

        const result = isEditing
            ? await workoutService.update(id!, dto)
            : await workoutService.create(dto);

        setSubmitting(false);

        if (result.ok) {
            onSave();
        } else {
            setSubmitError(result.error);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-canvas">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                <button
                    onClick={onBack}
                    className="text-sm font-medium text-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-foreground">
                    {isEditing ? 'Edit Workout' : 'New Workout'}
                </h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                <FormField label="Name" required error={nameError}>
                    <Input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    />
                </FormField>

                <FormField label="Discipline" required error={disciplineError}>
                    <div className="flex gap-2">
                        {DISCIPLINE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setDiscipline(opt.value); setDisciplineError(''); }}
                                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                    discipline === opt.value
                                        ? 'border-primary bg-primary/10 text-primary-dark'
                                        : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Total Duration (min)" error={totalDurationError}>
                        <Input
                            type="number"
                            value={totalDuration}
                            onChange={(e) => { setTotalDuration(e.target.value); setTotalDurationError(''); }}
                        />
                    </FormField>
                    <FormField label="Total Distance (km)" error={totalDistanceError}>
                        <Input
                            type="number"
                            value={totalDistance}
                            onChange={(e) => { setTotalDistance(e.target.value); setTotalDistanceError(''); }}
                        />
                    </FormField>
                </div>

                <FormField label="Notes">
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                    />
                </FormField>

                {/* Steps */}
                <section>
                    <h2 className="text-base font-semibold text-foreground mb-3">Steps</h2>
                    {stepsError && <p className="text-sm text-error mb-2">{stepsError}</p>}

                    <div className="flex flex-col gap-4">
                        {steps.map((step, index) => (
                            <StepEditor
                                key={index}
                                step={step}
                                index={index}
                                total={steps.length}
                                errors={stepErrors[index]}
                                onChange={(update) => updateStep(index, update)}
                                onRemove={() => removeStep(index)}
                                onMove={(dir) => moveStep(index, dir)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setSteps((prev) => [...prev, emptyStep()])}
                        className="mt-4 w-full text-sm font-medium text-primary hover:text-primary-dark"
                    >
                        + Add Step
                    </button>
                </section>

                {submitError && <p className="text-sm text-error">{submitError}</p>}

                <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Workout'}
                </Button>
            </main>
        </div>
    );
}

function StepEditor({
    step,
    index,
    total,
    errors,
    onChange,
    onRemove,
    onMove,
}: {
    step: WorkoutStep;
    index: number;
    total: number;
    errors?: StepErrors;
    onChange: (update: Partial<WorkoutStep>) => void;
    onRemove: () => void;
    onMove: (direction: 'up' | 'down') => void;
}) {
    function handleTypeChange(type: WorkoutStepType) {
        if (type === 'single') {
            onChange({ type, repeats: undefined });
        } else {
            onChange({ type, repeats: 2 });
        }
    }

    return (
        <div className="rounded-xl border border-navy/10 bg-surface p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Step {index + 1}</span>
                <div className="flex items-center gap-2">
                    {index > 0 && (
                        <button
                            type="button"
                            onClick={() => onMove('up')}
                            className="text-xs text-muted hover:text-foreground"
                        >
                            ↑
                        </button>
                    )}
                    {index < total - 1 && (
                        <button
                            type="button"
                            onClick={() => onMove('down')}
                            className="text-xs text-muted hover:text-foreground"
                        >
                            ↓
                        </button>
                    )}
                    {total > 1 && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-xs text-muted hover:text-error"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <FormField label="Step Name" required error={errors?.name}>
                <Input
                    value={step.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                />
            </FormField>

            <FormField label="Type" required error={errors?.type}>
                <div className="flex gap-2">
                    {(['single', 'repeat'] as WorkoutStepType[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => handleTypeChange(t)}
                            className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                                step.type === t
                                    ? 'border-primary bg-primary/10 text-primary-dark'
                                    : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                            }`}
                        >
                            {t === 'single' ? 'Single' : 'Repeat'}
                        </button>
                    ))}
                </div>
            </FormField>

            {step.type === 'repeat' && (
                <FormField label="Repeats" required error={errors?.repeats}>
                    <Input
                        type="number"
                        value={step.repeats !== undefined ? String(step.repeats) : ''}
                        min={2}
                        onChange={(e) => onChange({ repeats: e.target.value ? Number(e.target.value) : undefined })}
                    />
                </FormField>
            )}

            <FormField label="Metric" required error={errors?.metric}>
                <div className="flex gap-2">
                    {(['distance', 'time'] as WorkoutStepMetric[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => {
                                const defaultUnit = METRIC_UNITS[m][0].value;
                                onChange({ metric: m, unit: defaultUnit, value: 0 });
                            }}
                            className={`flex-1 rounded-xl border-2 px-2 py-2 text-sm font-medium transition-colors ${
                                step.metric === m
                                    ? 'border-primary bg-primary/10 text-primary-dark'
                                    : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                            }`}
                        >
                            {m === 'distance' ? 'Distance' : 'Time'}
                        </button>
                    ))}
                </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
                <FormField label="Unit" required error={errors?.unit}>
                    <Select
                        value={step.unit}
                        onChange={(e) => {
                            const newUnit = e.target.value as WorkoutStepUnit;
                            const displayValue = fromBaseValue(step.value, step.unit);
                            onChange({ unit: newUnit, value: toBaseValue(displayValue, newUnit) });
                        }}
                    >
                        {METRIC_UNITS[step.metric].map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="Value" required error={errors?.value}>
                    <Input
                        type="number"
                        value={fromBaseValue(step.value, step.unit) || ''}
                        min={0}
                        onChange={(e) => {
                            const displayVal = e.target.value ? Number(e.target.value) : 0;
                            onChange({ value: toBaseValue(displayVal, step.unit) });
                        }}
                    />
                </FormField>
            </div>

            <FormField label="Step Notes">
                <Textarea
                    value={step.notes ?? ''}
                    onChange={(e) => onChange({ notes: e.target.value || undefined })}
                    rows={2}
                />
            </FormField>
        </div>
    );
}
