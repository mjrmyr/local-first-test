import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutService } from '../../application/workoutService';
import type { Workout } from '../../domain/models/workout';
import type { Discipline } from '../../domain/types';
import { Button } from '../components/Button';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swimming',
    bike: 'Cycling',
    run: 'Running',
};

const ALL_DISCIPLINES: Discipline[] = ['swim', 'bike', 'run'];

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

export function WorkoutsPage() {
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [filter, setFilter] = useState<Discipline | 'all'>('all');

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const result = await workoutService.listAll();
        if (result.ok) {
            setWorkouts(result.data);
        } else {
            setLoadError(result.error);
        }
        setLoading(false);
    }

    async function handleDelete(workout: Workout) {
        setDeleteError('');
        const result = await workoutService.delete(workout.id);
        if (result.ok) {
            setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
        } else {
            setDeleteError(result.error);
        }
    }

    const filtered = filter === 'all' ? workouts : workouts.filter((w) => w.discipline === filter);

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
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-foreground">Workout Library</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                {loadError && <p className="text-sm text-error">{loadError}</p>}
                {deleteError && <p className="text-sm text-error">{deleteError}</p>}

                {/* Discipline filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                            filter === 'all'
                                ? 'border-primary bg-primary/10 text-primary-dark'
                                : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                        }`}
                    >
                        All
                    </button>
                    {ALL_DISCIPLINES.map((d) => (
                        <button
                            key={d}
                            onClick={() => setFilter(d)}
                            className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                                filter === d
                                    ? 'border-primary bg-primary/10 text-primary-dark'
                                    : 'border-navy/10 bg-surface text-foreground hover:border-navy/15'
                            }`}
                        >
                            {DISCIPLINE_LABELS[d]}
                        </button>
                    ))}
                </div>

                {/* Workout list */}
                {filtered.length === 0 && (
                    <p className="text-sm text-muted italic">No workouts yet</p>
                )}

                <div className="flex flex-col gap-3">
                    {filtered.map((workout) => (
                        <WorkoutCard
                            key={workout.id}
                            workout={workout}
                            onView={() => navigate(`/workouts/${workout.id}`)}
                            onEdit={() => navigate(`/workouts/${workout.id}/edit`)}
                            onDelete={() => handleDelete(workout)}
                        />
                    ))}
                </div>

                <Button onClick={() => navigate('/workouts/new')}>+ New Workout</Button>
            </main>
        </div>
    );
}

function WorkoutCard({
    workout,
    onView,
    onEdit,
    onDelete,
}: {
    workout: Workout;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const summary = workout.steps
        .map((s) => {
            const prefix = s.type === 'repeat' ? `${s.repeats}×` : '';
            return `${prefix}${formatStepValue(s.value, s.unit)} ${UNIT_LABELS[s.unit]}`;
        })
        .join(' → ');

    return (
        <div className="rounded-xl border border-navy/10 bg-surface p-4">
            <button onClick={onView} className="w-full text-left">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{workout.name}</span>
                    <span className="text-xs text-muted rounded-lg bg-canvas px-2 py-1">
                        {DISCIPLINE_LABELS[workout.discipline]}
                    </span>
                </div>
                {summary && (
                    <p className="text-sm text-muted mt-1 truncate">{summary}</p>
                )}
            </button>
            <div className="flex gap-2 mt-3 border-t border-navy/5 pt-3">
                <button
                    onClick={onEdit}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                >
                    Edit
                </button>
                {confirmDelete ? (
                    <span className="flex gap-2 ml-auto">
                        <button
                            onClick={() => { setConfirmDelete(false); onDelete(); }}
                            className="text-sm font-medium text-error hover:text-error"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-sm font-medium text-muted hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </span>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-sm font-medium text-muted hover:text-error ml-auto"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
