import { useEffect, useState } from 'react';
import { workoutService } from '../../application/workoutService';
import type { Workout } from '../../domain/models/workout';
import type { Discipline } from '../../domain/types';
import { Button } from '../components/Button';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swimming',
    bike: 'Cycling',
    run: 'Running',
};

const UNIT_LABELS: Record<string, string> = {
    meters: 'm',
    kilometers: 'km',
    minutes: 'min',
    hours: 'h',
};

function fromBaseValue(value: number, unit: string): number {
    switch (unit) {
        case 'kilometers': return value / 1000;
        case 'hours': return value / 3600;
        case 'minutes': return value / 60;
        default: return value;
    }
}

function formatStepValue(value: number, unit: string): string {
    const display = fromBaseValue(value, unit);
    return Number.isInteger(display) ? String(display) : display.toFixed(1);
}

export function WorkoutDetailPage({
    id,
    onBack,
    onEdit,
}: {
    id: string;
    onBack: () => void;
    onEdit: () => void;
}) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        workoutService.getById(id).then((result) => {
            if (result.ok && result.data) {
                setWorkout(result.data);
            } else {
                setError(result.ok ? 'Workout not found' : result.error);
            }
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="flex min-h-screen flex-col bg-canvas">
                <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                    <button
                        onClick={onBack}
                        className="text-sm font-medium text-muted hover:text-foreground"
                    >
                        ← Back
                    </button>
                </header>
                <main className="px-6 py-8">
                    <p className="text-sm text-error">{error || 'Workout not found'}</p>
                </main>
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
                <h1 className="text-lg font-bold text-foreground">{workout.name}</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                <div className="flex flex-wrap gap-3">
                    <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                        {DISCIPLINE_LABELS[workout.discipline]}
                    </span>
                    {workout.totalDuration && (
                        <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                            {workout.totalDuration} min
                        </span>
                    )}
                    {workout.totalDistance && (
                        <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                            {workout.totalDistance} km
                        </span>
                    )}
                </div>

                {workout.notes && (
                    <p className="text-sm text-muted">{workout.notes}</p>
                )}

                <section>
                    <h2 className="text-base font-semibold text-foreground mb-3">Steps</h2>
                    <div className="flex flex-col gap-2">
                        {workout.steps.map((step, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-navy/10 bg-surface p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                        {step.name}
                                    </span>
                                    <span className="text-xs text-muted">
                                        {step.type === 'repeat' && `${step.repeats}× `}
                                        {formatStepValue(step.value, step.unit)} {UNIT_LABELS[step.unit]}
                                    </span>
                                </div>
                                {step.notes && (
                                    <p className="text-xs text-muted mt-1">{step.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <Button onClick={onEdit}>
                    Edit Workout
                </Button>
            </main>
        </div>
    );
}
