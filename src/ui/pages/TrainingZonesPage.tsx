import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingZoneService } from '../../application/trainingZoneService';
import { VALID_ZONE_COMBINATIONS, type TrainingZones } from '../../domain/models/trainingZone';
import type { Discipline } from '../../domain/types';
import { Button } from '../components/Button';

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

export function TrainingZonesPage() {
    const navigate = useNavigate();
    const [zoneSets, setZoneSets] = useState<TrainingZones[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [deleteError, setDeleteError] = useState('');

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

    const grouped = DISCIPLINE_ORDER.reduce<Record<Discipline, TrainingZones[]>>(
        (acc, d) => {
            acc[d] = zoneSets.filter((z) => z.discipline === d);
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
                    onClick={() => navigate('/')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    ← Back
                </button>
                <h1 className="text-lg font-bold text-gray-900">Training Zones</h1>
            </header>

            <main className="flex flex-col gap-6 px-6 py-8 max-w-lg mx-auto w-full">
                {loadError && <p className="text-sm text-red-600">{loadError}</p>}
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

                {DISCIPLINE_ORDER.map((discipline) => {
                    const sets = grouped[discipline];
                    return (
                        <section key={discipline}>
                            <h2 className="text-base font-semibold text-gray-700 mb-3">
                                {DISCIPLINE_LABELS[discipline]}
                            </h2>
                            <div className="flex flex-col gap-3">
                                {sets.length === 0 && (
                                    <p className="text-sm text-gray-400 italic">No zones configured</p>
                                )}
                                {sets.map((zoneSet) => (
                                    <ZoneSetCard
                                        key={zoneSet.id}
                                        zoneSet={zoneSet}
                                        onEdit={() =>
                                            navigate(
                                                `/training-zones/${zoneSet.discipline}/${zoneSet.metric}/edit`,
                                            )
                                        }
                                        onDelete={() => handleDelete(zoneSet)}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {zoneSets.length < TOTAL_POSSIBLE_ZONE_SETS && (
                    <Button onClick={() => navigate('/training-zones/new')}>
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
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">
                    {METRIC_LABELS[zoneSet.metric] ?? zoneSet.metric}
                </span>
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
            <div className="flex flex-col gap-1">
                {zoneSet.zones.map((zone, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{zone.name}</span>
                        <span className="text-gray-500 font-mono">
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
