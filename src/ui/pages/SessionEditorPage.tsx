import { useEffect, useState } from 'react';
import { sessionService } from '../../application/sessionService';
import { workoutService } from '../../application/workoutService';
import { validateSession, type SessionErrors } from '../../domain/rules/validateSession';
import type { Workout } from '../../domain/models/workout';
import type { Discipline } from '../../domain/types';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';

const DISCIPLINE_OPTIONS: { value: Discipline; label: string }[] = [
    { value: 'swim', label: 'Swimming' },
    { value: 'bike', label: 'Cycling' },
    { value: 'run', label: 'Running' },
];

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

    const [errors, setErrors] = useState<SessionErrors>({});
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);

    // Workout picker
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);

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
            } else {
                setSubmitError('Failed to load session');
            }
            setLoading(false);
        });
    }, [isEditing, id]);

    function applyWorkout(workout: Workout) {
        setName(workout.name);
        setDiscipline(workout.discipline);
        if (workout.totalDuration) setTotalDuration(String(workout.totalDuration));
        if (workout.totalDistance) setTotalDistance(String(workout.totalDistance));
        setShowWorkoutPicker(false);
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
        <div className="flex min-h-screen flex-col bg-canvas">
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

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
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
                            <Button variant="secondary" onClick={() => setShowWorkoutPicker(true)}>
                                From Workout Library
                            </Button>
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

                {submitError && <p className="text-sm text-error">{submitError}</p>}

                <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Session'}
                </Button>
            </main>
        </div>
    );
}
