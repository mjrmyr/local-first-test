import { useEffect, useState } from 'react';
import { sessionService } from '../../application/sessionService';
import { workoutService } from '../../application/workoutService';
import { validateSession, type SessionErrors } from '../../domain/rules/validateSession';
import type { Workout, WorkoutStep } from '../../domain/models/workout';
import type { Discipline, WorkoutStepMetric, WorkoutStepType, WorkoutStepUnit } from '../../domain/types';
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

export function SessionEditorPage({
    id,
    initialDate,
    onBack,
    onSave,
}: {
    id?: string;
    initialDate?: string;
    onBack: () => void;
    onSave: () => void;
}) {
    const isEditing = !!id;

    const [name, setName] = useState('');
    const [date, setDate] = useState(initialDate ?? '');
    const [discipline, setDiscipline] = useState<Discipline | ''>('');
    const [totalDuration, setTotalDuration] = useState('');
    const [totalDistance, setTotalDistance] = useState('');
    const [note, setNote] = useState('');
    const [steps, setSteps] = useState<WorkoutStep[]>([]);

    const [errors, setErrors] = useState<SessionErrors>({});
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);

    // Workout picker
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
    const [selectedWorkoutName, setSelectedWorkoutName] = useState('');
    const [disciplineLockedByTemplate, setDisciplineLockedByTemplate] = useState(false);
    const [collapsedStepIndexes, setCollapsedStepIndexes] = useState<Set<number>>(new Set());

    useEffect(() => {
        workoutService.listAll().then((result) => {
            if (result.ok) setWorkouts(result.data);
        });
    }, []);

    useEffect(() => {
        if (!isEditing || !id) return;
        sessionService.getById(id).then((result) => {
            if (result.ok && result.data) {
                const s = result.data;
                setName(s.name);
                setDate(s.date);
                setDiscipline(s.discipline);
                setTotalDuration(s.totalDuration ? String(s.totalDuration) : '');
                setTotalDistance(s.totalDistance ? String(s.totalDistance) : '');
                setNote(s.note ?? '');
                setSteps(s.steps ?? []);
            } else {
                setSubmitError('Failed to load session');
            }
            setLoading(false);
        });
    }, [isEditing, id]);

    function applyWorkout(workout: Workout) {
        setName(workout.name);
        setDiscipline(workout.discipline);
        setTotalDuration(workout.totalDuration ? String(workout.totalDuration) : '');
        setTotalDistance(workout.totalDistance ? String(workout.totalDistance) : '');
        if (workout.steps?.length) {
            setSteps(workout.steps.map((s) => ({ ...s })));
            setCollapsedStepIndexes(new Set(workout.steps.map((_, index) => index)));
        } else {
            setSteps([]);
            setCollapsedStepIndexes(new Set());
        }
        setSelectedWorkoutName(workout.name);
        setDisciplineLockedByTemplate(true);
        setShowWorkoutPicker(false);
    }

    function clearTemplateLock() {
        setSelectedWorkoutName('');
        setDisciplineLockedByTemplate(false);
    }

    function updateStep(index: number, update: Partial<WorkoutStep>) {
        setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
    }

    function removeStep(index: number) {
        setSteps((prev) => prev.filter((_, i) => i !== index));
        setCollapsedStepIndexes((prev) => {
            const next = new Set<number>();
            prev.forEach((value) => {
                if (value < index) next.add(value);
                if (value > index) next.add(value - 1);
            });
            return next;
        });
    }

    function moveStep(index: number, direction: 'up' | 'down') {
        const target = direction === 'up' ? index - 1 : index + 1;
        setSteps((prev) => {
            const next = [...prev];
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
        setCollapsedStepIndexes((prev) => {
            if (target < 0 || target >= steps.length) return prev;
            const next = new Set(prev);
            const fromCollapsed = next.has(index);
            const toCollapsed = next.has(target);
            if (fromCollapsed) next.add(target);
            else next.delete(target);
            if (toCollapsed) next.add(index);
            else next.delete(index);
            return next;
        });
    }

    function toggleStepCollapsed(index: number) {
        setCollapsedStepIndexes((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }

    function collapseAllSteps() {
        setCollapsedStepIndexes(new Set(steps.map((_, index) => index)));
    }

    function expandAllSteps() {
        setCollapsedStepIndexes(new Set());
    }

    function buildDTO() {
        const parsedDuration = totalDuration ? Number(totalDuration) : undefined;
        const parsedDistance = totalDistance ? Number(totalDistance) : undefined;
        return {
            name: name.trim(),
            date,
            discipline: discipline as Discipline,
            totalDuration: parsedDuration,
            totalDistance: parsedDistance,
            note: note.trim() || undefined,
            steps: steps.length > 0 ? steps : undefined,
        };
    }

    function clientValidate(): boolean {
        const dto = buildDTO();
        const result = validateSession(dto);
        if (!result) {
            setErrors({});
            return true;
        }
        setErrors(result);
        return false;
    }

    async function handleSave() {
        if (!clientValidate()) return;

        setSubmitting(true);
        setSubmitError('');

        const dto = buildDTO();

        const result = isEditing
            ? await sessionService.update(id!, dto)
            : await sessionService.create(dto);

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
        <div className="flex flex-1 flex-col bg-canvas overflow-hidden">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                <button
                    onClick={onBack}
                    className="text-sm font-medium text-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-foreground">
                    {isEditing ? 'Edit Session' : 'New Session'}
                </h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
                {!isEditing && workouts.length > 0 && (
                    <div>
                        {showWorkoutPicker ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">Pick a workout</span>
                                    <button
                                        onClick={() => setShowWorkoutPicker(false)}
                                        className="text-sm text-muted hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {workouts.map((w) => (
                                    <button
                                        key={w.id}
                                        onClick={() => applyWorkout(w)}
                                        className="rounded-xl border border-navy/10 bg-surface p-3 text-left hover:border-primary/30"
                                    >
                                        <span className="text-sm font-medium text-foreground">{w.name}</span>
                                        <span className="text-xs text-muted ml-2">{w.discipline}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Button variant="secondary" onClick={() => setShowWorkoutPicker(true)}>
                                    From Workout Library
                                </Button>
                                {disciplineLockedByTemplate && (
                                    <div className="flex items-center justify-between rounded-xl border border-navy/10 bg-surface px-3 py-2">
                                        <span className="text-xs text-muted">
                                            Template: <span className="font-medium text-foreground">{selectedWorkoutName}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearTemplateLock}
                                            className="text-xs font-medium text-primary hover:text-primary-dark"
                                        >
                                            Remove template lock
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <FormField label="Name" required error={errors.name}>
                    <Input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    />
                </FormField>

                <FormField label="Date" required error={errors.date}>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                    />
                </FormField>

                <FormField label="Discipline" required error={errors.discipline}>
                    <div className="flex gap-2">
                        {DISCIPLINE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { setDiscipline(opt.value); setErrors((p) => ({ ...p, discipline: undefined })); }}
                                disabled={disciplineLockedByTemplate}
                                className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                                    discipline === opt.value
                                        ? 'border-primary bg-primary/10 text-primary-dark'
                                        : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                                } ${disciplineLockedByTemplate ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {disciplineLockedByTemplate && (
                        <p className="mt-2 text-xs text-muted">Discipline is locked because this session was created from a workout template.</p>
                    )}
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Duration (min)" error={errors.totalDuration}>
                        <Input
                            type="number"
                            value={totalDuration}
                            onChange={(e) => { setTotalDuration(e.target.value); setErrors((p) => ({ ...p, totalDuration: undefined })); }}
                        />
                    </FormField>
                    <FormField label="Distance (km)" error={errors.totalDistance}>
                        <Input
                            type="number"
                            value={totalDistance}
                            onChange={(e) => { setTotalDistance(e.target.value); setErrors((p) => ({ ...p, totalDistance: undefined })); }}
                        />
                    </FormField>
                </div>

                <FormField label="Note">
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                    />
                </FormField>

                {/* Steps */}
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-foreground">Steps</h2>
                        {steps.length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={expandAllSteps}
                                    className="text-xs font-medium text-muted hover:text-foreground"
                                >
                                    Expand all
                                </button>
                                <button
                                    type="button"
                                    onClick={collapseAllSteps}
                                    className="text-xs font-medium text-muted hover:text-foreground"
                                >
                                    Collapse all
                                </button>
                            </div>
                        )}
                    </div>

                    {steps.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {steps.map((step, index) => (
                                <SessionStepEditor
                                    key={index}
                                    step={step}
                                    index={index}
                                    total={steps.length}
                                    collapsed={collapsedStepIndexes.has(index)}
                                    onToggleCollapsed={() => toggleStepCollapsed(index)}
                                    onChange={(update) => updateStep(index, update)}
                                    onRemove={() => removeStep(index)}
                                    onMove={(dir) => moveStep(index, dir)}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setSteps((prev) => [...prev, emptyStep()]);
                            setCollapsedStepIndexes((prev) => {
                                const next = new Set(prev);
                                next.delete(steps.length);
                                return next;
                            });
                        }}
                        className="mt-4 w-full text-sm font-medium text-primary hover:text-primary-dark"
                    >
                        + Add Step
                    </button>
                </section>

                {submitError && <p className="text-sm text-error">{submitError}</p>}

                <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Session'}
                </Button>
            </main>
        </div>
    );
}

function SessionStepEditor({
    step,
    index,
    total,
    collapsed,
    onToggleCollapsed,
    onChange,
    onRemove,
    onMove,
}: {
    step: WorkoutStep;
    index: number;
    total: number;
    collapsed: boolean;
    onToggleCollapsed: () => void;
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
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    className="text-xs font-semibold text-muted hover:text-foreground"
                >
                    {collapsed ? '> ' : 'v '}Step {index + 1} {step.name ? `- ${step.name}` : ''}
                </button>
                <div className="flex items-center gap-2">
                    {index > 0 && (
                        <button type="button" onClick={() => onMove('up')} className="text-xs text-muted hover:text-foreground">↑</button>
                    )}
                    {index < total - 1 && (
                        <button type="button" onClick={() => onMove('down')} className="text-xs text-muted hover:text-foreground">↓</button>
                    )}
                    <button type="button" onClick={onRemove} className="text-xs text-muted hover:text-error">Remove</button>
                </div>
            </div>

            {!collapsed && (
                <>
                    <FormField label="Step Name" required>
                        <Input
                            value={step.name}
                            onChange={(e) => onChange({ name: e.target.value })}
                        />
                    </FormField>

                    <FormField label="Type" required>
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
                        <FormField label="Repeats" required>
                            <Input
                                type="number"
                                value={step.repeats !== undefined ? String(step.repeats) : ''}
                                min={2}
                                onChange={(e) => onChange({ repeats: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </FormField>
                    )}

                    <FormField label="Metric" required>
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
                        <FormField label="Unit" required>
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
                        <FormField label="Value" required>
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
                </>
            )}
        </div>
    );
}
