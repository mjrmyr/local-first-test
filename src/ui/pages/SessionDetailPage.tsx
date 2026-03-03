import { useEffect, useState } from 'react';
import { sessionService } from '../../application/sessionService';
import type { Session } from '../../domain/models/session';
import type { WorkoutStep } from '../../domain/models/workout';
import type { Discipline, WorkoutStepUnit } from '../../domain/types';
import { Button } from '../components/Button';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swimming',
    bike: 'Cycling',
    run: 'Running',
};

export function SessionDetailPage({
    id,
    onBack,
    onEdit,
    onDelete,
}: {
    id: string;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!id) return;
        sessionService.getById(id).then((result) => {
            if (result.ok && result.data) {
                setSession(result.data);
            } else {
                setError(result.ok ? 'Session not found' : result.error);
            }
            setLoading(false);
        });
    }, [id]);

    async function handleDelete() {
        const result = await sessionService.delete(id);
        if (result.ok) {
            onDelete();
        } else {
            setError(result.error);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="flex flex-1 flex-col bg-canvas overflow-hidden">
                <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                    <button
                        onClick={onBack}
                        className="text-sm font-medium text-muted hover:text-foreground"
                    >
                        ← Back
                    </button>
                </header>
                <main className="px-6 py-8">
                    <p className="text-sm text-error">{error || 'Session not found'}</p>
                </main>
            </div>
        );
    }

    const dateFormatted = new Date(session.date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="flex flex-1 flex-col bg-canvas overflow-hidden">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                <button
                    onClick={onBack}
                    className="text-sm font-medium text-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-foreground">{session.name}</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full flex-1 overflow-y-auto">
                <div className="flex flex-wrap gap-3">
                    <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                        {DISCIPLINE_LABELS[session.discipline]}
                    </span>
                    <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                        {dateFormatted}
                    </span>
                    {session.totalDuration && (
                        <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                            {session.totalDuration} min
                        </span>
                    )}
                    {session.totalDistance && (
                        <span className="text-xs text-muted rounded-lg bg-surface border border-navy/10 px-2 py-1">
                            {session.totalDistance} km
                        </span>
                    )}
                </div>

                {session.note && (
                    <p className="text-sm text-muted">{session.note}</p>
                )}

                {session.steps && session.steps.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold text-foreground">Steps</h2>
                        {session.steps.map((step, i) => (
                            <StepCard key={i} step={step} index={i} />
                        ))}
                    </section>
                )}

                <Button onClick={onEdit}>Edit Session</Button>

                {confirmDelete ? (
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">
                            Cancel
                        </Button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 rounded-xl px-4 py-3 font-semibold bg-error text-white hover:bg-error/80"
                        >
                            Confirm Delete
                        </button>
                    </div>
                ) : (
                    <Button variant="secondary" onClick={() => setConfirmDelete(true)}>
                        Delete Session
                    </Button>
                )}
            </main>
        </div>
    );
}

function formatStepValue(value: number, unit: WorkoutStepUnit): string {
    switch (unit) {
        case 'kilometers': return `${value / 1000} km`;
        case 'meters': return `${value} m`;
        case 'hours': return `${value / 3600} h`;
        case 'minutes': return `${value / 60} min`;
    }
}

function StepCard({ step, index }: { step: WorkoutStep; index: number }) {
    return (
        <div className="rounded-xl border border-navy/10 bg-surface p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{step.name || `Step ${index + 1}`}</span>
                <span className="text-xs text-muted capitalize">{step.type}{step.type === 'repeat' && step.repeats ? ` ×${step.repeats}` : ''}</span>
            </div>
            <span className="text-xs text-muted">
                {formatStepValue(step.value, step.unit)}
            </span>
            {step.notes && (
                <p className="text-xs text-muted/70 mt-1">{step.notes}</p>
            )}
        </div>
    );
}
