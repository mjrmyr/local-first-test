import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingZoneService } from '../../application/trainingZoneService';
import { VALID_ZONE_COMBINATIONS, type TrainingZones } from '../../domain/models/trainingZone';
import type { Discipline } from '../../domain/types';
import type { Metric } from '../../domain/types';
import { Button } from '../components/Button';
import { TrainingZoneEditorPage } from './TrainingZoneEditorPage';

const TOTAL_POSSIBLE_ZONE_SETS = Object.values(VALID_ZONE_COMBINATIONS).reduce(
    (sum, metrics) => sum + metrics.length,
    0,
);

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swimming',
    bike: 'Cycling',
    run: 'Running',
};

const METRIC_LABELS: Record<string, string> = {
    hr: 'Heart Rate (bpm)',
    pace: 'Pace (min/km)',
    power: 'Power (watts)',
};

const DISCIPLINE_ORDER: Discipline[] = ['swim', 'bike', 'run'];

function formatPace(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatZoneValue(value: number, metric: string): string {
    if (metric === 'pace') return formatPace(value);
    return String(value);
}

type EditorState =
    | { mode: 'new' }
    | { mode: 'edit'; discipline: Discipline; metric: Metric };

export function TrainingZonesPage() {
    const navigate = useNavigate();
    const [zoneSets, setZoneSets] = useState<TrainingZones[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [editorState, setEditorState] = useState<EditorState | null>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const result = await trainingZoneService.listActive();
        if (result.ok) {
            setZoneSets(result.data);
        } else {
            setLoadError(result.error);
        }
        setLoading(false);
    }

    async function handleDelete(zoneSet: TrainingZones) {
        setDeleteError('');
        const result = await trainingZoneService.delete(zoneSet.discipline, zoneSet.metric);
        if (result.ok) {
            setZoneSets((prev) => prev.filter((z) => z.id !== zoneSet.id));
        } else {
            setDeleteError(result.error);
        }
    }

    if (editorState !== null) {
        const isEditing = editorState.mode === 'edit';
        return (
            <TrainingZoneEditorPage
                isEditing={isEditing}
                discipline={isEditing ? editorState.discipline : undefined}
                metric={isEditing ? editorState.metric : undefined}
                onBack={() => setEditorState(null)}
                onSave={() => { setEditorState(null); load(); }}
            />
        );
    }

    const grouped = DISCIPLINE_ORDER.reduce<Record<Discipline, TrainingZones[]>>(
        (acc, d) => {
            acc[d] = zoneSets.filter((z) => z.discipline === d);
            return acc;
        },
        { swim: [], bike: [], run: [] },
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-canvas">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-navy/10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-muted hover:text-foreground"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-foreground">Training Zones</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                {loadError && <p className="text-sm text-error">{loadError}</p>}
                {deleteError && <p className="text-sm text-error">{deleteError}</p>}

                {DISCIPLINE_ORDER.map((discipline) => {
                    const sets = grouped[discipline];
                    return (
                        <section key={discipline}>
                            <h2 className="text-base font-semibold text-foreground mb-3">
                                {DISCIPLINE_LABELS[discipline]}
                            </h2>
                            <div className="flex flex-col gap-3">
                                {sets.length === 0 && (
                                    <p className="text-sm text-muted italic">No zones configured</p>
                                )}
                                {sets.map((zoneSet) => (
                                    <ZoneSetCard
                                        key={zoneSet.id}
                                        zoneSet={zoneSet}
                                        onEdit={() =>
                                            setEditorState({
                                                mode: 'edit',
                                                discipline: zoneSet.discipline,
                                                metric: zoneSet.metric,
                                            })
                                        }
                                        onDelete={() => handleDelete(zoneSet)}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {zoneSets.length < TOTAL_POSSIBLE_ZONE_SETS && (
                    <Button onClick={() => setEditorState({ mode: 'new' })}>
                        + Add Zone Set
                    </Button>
                )}
            </main>
        </div>
    );
}

function ZoneSetCard({
    zoneSet,
    onEdit,
    onDelete,
}: {
    zoneSet: TrainingZones;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="rounded-xl border border-navy/10 bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-foreground">
                    {METRIC_LABELS[zoneSet.metric] ?? zoneSet.metric}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                        Edit
                    </button>
                    {confirmDelete ? (
                        <span className="flex gap-2">
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
                            className="text-sm font-medium text-muted hover:text-error"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                {zoneSet.zones.map((zone, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{zone.name}</span>
                        <span className="text-muted font-mono">
                            {formatZoneValue(zone.min, zoneSet.metric)}
                            {' – '}
                            {formatZoneValue(zone.max, zoneSet.metric)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
