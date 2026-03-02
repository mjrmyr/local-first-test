import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { thresholdService } from '../../application/thresholdService';
import { VALID_THRESHOLD_COMBINATIONS, type Threshold } from '../../domain/models/threshold';
import type { Discipline } from '../../domain/types';
import type { Metric } from '../../domain/types';
import { Button } from '../components/Button';
import { ThresholdEditorPage } from './ThresholdEditorPage';

const TOTAL_POSSIBLE_THRESHOLDS = Object.values(VALID_THRESHOLD_COMBINATIONS).reduce(
    (sum, metrics) => sum + metrics.length,
    0,
);

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swimming',
    bike: 'Cycling',
    run: 'Running',
};

const METRIC_LABELS: Record<string, string> = {
    hr: 'Heart Rate',
    pace: 'Pace',
    power: 'Power',
};

const METRIC_UNITS: Record<string, string> = {
    hr: 'bpm',
    pace: 'min/km',
    power: 'watts',
};

const DISCIPLINE_ORDER: Discipline[] = ['swim', 'bike', 'run'];

function formatPace(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatValue(value: number, metric: string): string {
    if (metric === 'pace') return formatPace(value);
    return String(value);
}

type EditorState =
    | { mode: 'new' }
    | { mode: 'edit'; discipline: Discipline; metric: Metric };

export function ThresholdsPage() {
    const navigate = useNavigate();
    const [thresholds, setThresholds] = useState<Threshold[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [editorState, setEditorState] = useState<EditorState | null>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        const result = await thresholdService.listActive();
        if (result.ok) {
            setThresholds(result.data);
        } else {
            setLoadError(result.error);
        }
        setLoading(false);
    }

    async function handleDelete(threshold: Threshold) {
        setDeleteError('');
        const result = await thresholdService.delete(threshold.discipline, threshold.metric);
        if (result.ok) {
            setThresholds((prev) => prev.filter((t) => t.id !== threshold.id));
        } else {
            setDeleteError(result.error);
        }
    }

    if (editorState !== null) {
        const isEditing = editorState.mode === 'edit';
        return (
            <ThresholdEditorPage
                isEditing={isEditing}
                discipline={isEditing ? editorState.discipline : undefined}
                metric={isEditing ? editorState.metric : undefined}
                onBack={() => setEditorState(null)}
                onSave={() => { setEditorState(null); load(); }}
            />
        );
    }

    const grouped = DISCIPLINE_ORDER.reduce<Record<Discipline, Threshold[]>>(
        (acc, d) => {
            acc[d] = thresholds.filter((t) => t.discipline === d);
            return acc;
        },
        { swim: [], bike: [], run: [] },
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fff4e1]">
                <span className="text-gray-400">Loading…</span>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">Thresholds</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                {loadError && <p className="text-sm text-red-600">{loadError}</p>}
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

                {DISCIPLINE_ORDER.map((discipline) => {
                    const items = grouped[discipline];
                    return (
                        <section key={discipline}>
                            <h2 className="text-base font-semibold text-gray-700 mb-3">
                                {DISCIPLINE_LABELS[discipline]}
                            </h2>
                            <div className="flex flex-col gap-3">
                                {items.length === 0 && (
                                    <p className="text-sm text-gray-400 italic">No thresholds configured</p>
                                )}
                                {items.map((threshold) => (
                                    <ThresholdCard
                                        key={threshold.id}
                                        threshold={threshold}
                                        onEdit={() =>
                                            setEditorState({
                                                mode: 'edit',
                                                discipline: threshold.discipline,
                                                metric: threshold.metric,
                                            })
                                        }
                                        onDelete={() => handleDelete(threshold)}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {thresholds.length < TOTAL_POSSIBLE_THRESHOLDS && (
                    <Button onClick={() => setEditorState({ mode: 'new' })}>+ Add Threshold</Button>
                )}
            </main>
        </div>
    );
}

function ThresholdCard({
    threshold,
    onEdit,
    onDelete,
}: {
    threshold: Threshold;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-medium text-gray-800">
                        {METRIC_LABELS[threshold.metric] ?? threshold.metric}
                    </span>
                    <span className="ml-2 font-mono text-gray-700">
                        {formatValue(threshold.value, threshold.metric)}
                    </span>
                    <span className="ml-1 text-sm text-gray-400">
                        {METRIC_UNITS[threshold.metric]}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                        Edit
                    </button>
                    {confirmDelete ? (
                        <span className="flex gap-2">
                            <button
                                onClick={() => { setConfirmDelete(false); onDelete(); }}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </span>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="text-sm font-medium text-gray-400 hover:text-red-500"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
