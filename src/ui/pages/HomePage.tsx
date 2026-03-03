import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { athleteService } from '../../application/athleteService';
import { sessionService } from '../../application/sessionService';
import type { Athlete } from '../../domain/models/athlete';
import type { Session } from '../../domain/models/session';
import type { Discipline } from '../../domain/types';
import { addDays, formatFullDate, toDateString } from '../../helpers/date';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
    swim: 'Swim',
    bike: 'Bike',
    run: 'Run',
};

const DISCIPLINE_COLORS: Record<Discipline, string> = {
    swim: 'bg-info/20 text-info',
    bike: 'bg-success/20 text-success',
    run: 'bg-warning/20 text-warning',
};

export function HomePage() {
    const navigate = useNavigate();
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const today = useMemo(() => new Date(), []);
    const todayStr = toDateString(today);

    useEffect(() => {
        async function load() {
            const [athleteResult, sessionsResult] = await Promise.all([
                athleteService.getActive(),
                sessionService.listByDateRange(
                    toDateString(addDays(today, -3)),
                    toDateString(addDays(today, 3)),
                ),
            ]);
            if (athleteResult.ok && athleteResult.data) setAthlete(athleteResult.data);
            if (sessionsResult.ok) setSessions(sessionsResult.data);
            setLoading(false);
        }
        load();
    }, [today]);

    const { todaySessions, upcomingSessions, pastSessions } = useMemo(() => {
        const todayList: Session[] = [];
        const upcoming: Session[] = [];
        const past: Session[] = [];

        for (const s of sessions) {
            if (s.date === todayStr) {
                todayList.push(s);
            } else if (s.date > todayStr) {
                upcoming.push(s);
            } else {
                past.push(s);
            }
        }

        // Upcoming: sorted ascending (soonest first)
        upcoming.sort((a, b) => a.date.localeCompare(b.date));
        // Past: sorted descending (most recent first)
        past.sort((a, b) => b.date.localeCompare(a.date));

        return { todaySessions: todayList, upcomingSessions: upcoming, pastSessions: past };
    }, [sessions, todayStr]);

    function openSession(id: string) {
        navigate(`/calendar?session=${id}`);
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    const firstName = athlete?.name.split(' ')[0] ?? 'Athlete';
    const hour = today.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Greeting */}
            <div className="px-6 pt-6 pb-4">
                <h1 className="text-2xl font-bold text-foreground">
                    {greeting}, {firstName}
                </h1>
                <p className="text-sm text-muted mt-1">{formatFullDate(today)}</p>
            </div>

            {/* Today's sessions */}
            <section className="px-6 pb-6">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Today</h2>
                {todaySessions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {todaySessions.map((s) => (
                            <SessionCard key={s.id} session={s} onClick={() => openSession(s.id)} highlight />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted/60 italic">No sessions planned for today</p>
                )}
            </section>

            {/* Upcoming sessions */}
            <section className="px-6 pb-6">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Upcoming</h2>
                {upcomingSessions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {upcomingSessions.map((s) => (
                            <SessionCard key={s.id} session={s} onClick={() => openSession(s.id)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted/60 italic">No upcoming sessions</p>
                )}
            </section>

            {/* Past sessions */}
            <section className="px-6 pb-6">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Recent</h2>
                {pastSessions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {pastSessions.map((s) => (
                            <SessionCard key={s.id} session={s} onClick={() => openSession(s.id)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted/60 italic">No recent sessions</p>
                )}
            </section>
        </div>
    );
}

function SessionCard({
    session,
    onClick,
    highlight,
}: {
    session: Session;
    onClick: () => void;
    highlight?: boolean;
}) {
    const dateObj = new Date(session.date + 'T00:00:00');
    const dateLabel = dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                highlight
                    ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15'
                    : 'bg-surface border border-navy/5 hover:bg-surface/80'
            }`}
        >
            <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DISCIPLINE_COLORS[session.discipline]}`}
            >
                {DISCIPLINE_LABELS[session.discipline]}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground truncate">{session.name}</span>
                {!highlight && (
                    <span className="text-xs text-muted">{dateLabel}</span>
                )}
            </div>
            <span className="flex items-center gap-2 shrink-0">
                {session.totalDuration != null && (
                    <span className="text-xs text-muted">{session.totalDuration}min</span>
                )}
                {session.totalDistance != null && (
                    <span className="text-xs text-muted">{session.totalDistance}km</span>
                )}
            </span>
        </button>
    );
}
