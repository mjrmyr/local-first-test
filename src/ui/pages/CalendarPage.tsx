import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sessionService } from '../../application/sessionService';
import type { Session } from '../../domain/models/session';
import type { Discipline } from '../../domain/types';
import {
    addDays,
    formatDayMonth,
    formatMonthYear,
    formatWeekday,
    getMonthGrid,
    getWeekDates,
    isToday,
    startOfWeek,
    toDateString,
} from '../../helpers/date';
import { SessionDetailPage } from './SessionDetailPage';
import { SessionEditorPage } from './SessionEditorPage';

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

type CalendarView = 'list' | 'week' | 'month';

type ViewState =
    | null
    | { mode: 'new'; date?: string }
    | { mode: 'view'; id: string }
    | { mode: 'edit'; id: string };

// ─── Main CalendarPage ──────────────────────────────────────────────

export function CalendarPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [desktopView, setDesktopView] = useState<CalendarView>('month');
    const [viewState, setViewState] = useState<ViewState>(null);
    const [anchor, setAnchor] = useState(new Date());

    // Open split view if ?session=<id> is present
    useEffect(() => {
        const sessionId = searchParams.get('session');
        if (sessionId) {
            setViewState({ mode: 'view', id: sessionId });
            setSearchParams({}, { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const load = useCallback(async () => {
        const result = await sessionService.listAll();
        if (result.ok) setSessions(result.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const sessionsByDate = useMemo(() => {
        const map = new Map<string, Session[]>();
        for (const s of sessions) {
            const arr = map.get(s.date) ?? [];
            arr.push(s);
            map.set(s.date, arr);
        }
        return map;
    }, [sessions]);

    function handleSave() {
        setViewState(null);
        load();
    }

    function handleDelete() {
        setViewState(null);
        load();
    }

    const scrollToTodayRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        function handleTapActive(e: Event) {
            if ((e as CustomEvent).detail === '/calendar') {
                setViewState(null);
                scrollToTodayRef.current?.();
            }
        }
        window.addEventListener('nav:tap-active', handleTapActive);
        return () => window.removeEventListener('nav:tap-active', handleTapActive);
    }, []);

    const viewingSession = viewState?.mode === 'view' ? viewState : null;
    const editingSession = viewState?.mode === 'edit' || viewState?.mode === 'new' ? viewState : null;

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <span className="text-muted">Loading…</span>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Mobile: list view, full-screen detail, or full-screen editor */}
            <div className="flex flex-1 flex-col lg:hidden overflow-hidden">
                {editingSession ? (
                    <SessionEditorPage
                        id={editingSession.mode === 'edit' ? editingSession.id : undefined}
                        initialDate={editingSession.mode === 'new' ? editingSession.date : undefined}
                        onBack={() => setViewState(null)}
                        onSave={handleSave}
                    />
                ) : viewingSession ? (
                    <SessionDetailPage
                        id={viewingSession.id}
                        onBack={() => setViewState(null)}
                        onEdit={() => setViewState({ mode: 'edit', id: viewingSession.id })}
                        onDelete={handleDelete}
                    />
                ) : (
                    <>
                        <MobileHeader
                            onAdd={() => setViewState({ mode: 'new', date: toDateString(new Date()) })}
                        />
                        <div className="flex-1 overflow-hidden">
                            <ListView
                                sessions={sessions}
                                onSelect={(id) => setViewState({ mode: 'view', id })}
                                onAddOnDate={(date) => setViewState({ mode: 'new', date })}
                                scrollToTodayRef={scrollToTodayRef}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Desktop: calendar views + split detail */}
            <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
                <DesktopHeader
                    view={desktopView}
                    onViewChange={setDesktopView}
                    anchor={anchor}
                    onAnchorChange={setAnchor}
                    onAdd={() => setViewState({ mode: 'new', date: toDateString(new Date()) })}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className={`flex-1 overflow-y-auto ${viewingSession || editingSession ? 'border-r border-navy/10' : ''}`}>
                        {desktopView === 'list' && (
                            <ListView
                                sessions={sessions}
                                onSelect={(id) => setViewState({ mode: 'view', id })}
                                onAddOnDate={(date) => setViewState({ mode: 'new', date })}
                                scrollToTodayRef={scrollToTodayRef}
                            />
                        )}
                        {desktopView === 'week' && (
                            <WeekView
                                anchor={anchor}
                                sessionsByDate={sessionsByDate}
                                onSelect={(id) => setViewState({ mode: 'view', id })}
                                onAddOnDate={(date) => setViewState({ mode: 'new', date })}
                            />
                        )}
                        {desktopView === 'month' && (
                            <MonthView
                                anchor={anchor}
                                sessionsByDate={sessionsByDate}
                                onSelect={(id) => setViewState({ mode: 'view', id })}
                                onAddOnDate={(date) => setViewState({ mode: 'new', date })}
                            />
                        )}
                    </div>
                    {/* Desktop split panel: editor or detail */}
                    {editingSession ? (
                        <div className="w-100 shrink-0 overflow-y-auto">
                            <SessionEditorPage
                                id={editingSession.mode === 'edit' ? editingSession.id : undefined}
                                initialDate={editingSession.mode === 'new' ? editingSession.date : undefined}
                                onBack={() => setViewState(null)}
                                onSave={handleSave}
                            />
                        </div>
                    ) : viewingSession ? (
                        <div className="w-100 shrink-0 overflow-y-auto">
                            <SessionDetailPage
                                id={viewingSession.id}
                                onBack={() => setViewState(null)}
                                onEdit={() => setViewState({ mode: 'edit', id: viewingSession.id })}
                                onDelete={handleDelete}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─── Mobile Header ──────────────────────────────────────────────────

function MobileHeader({ onAdd }: { onAdd: () => void }) {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-navy/10 shrink-0">
            <h1 className="text-lg font-bold text-foreground">Calendar</h1>
            <button
                onClick={onAdd}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
                + Add
            </button>
        </header>
    );
}

// ─── Desktop Header ─────────────────────────────────────────────────

function DesktopHeader({
    view,
    onViewChange,
    anchor,
    onAnchorChange,
    onAdd,
}: {
    view: CalendarView;
    onViewChange: (v: CalendarView) => void;
    anchor: Date;
    onAnchorChange: (d: Date) => void;
    onAdd: () => void;
}) {
    function navigateBack() {
        if (view === 'month') {
            onAnchorChange(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
        } else if (view === 'week') {
            onAnchorChange(addDays(anchor, -7));
        }
    }

    function navigateForward() {
        if (view === 'month') {
            onAnchorChange(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
        } else if (view === 'week') {
            onAnchorChange(addDays(anchor, 7));
        }
    }

    function goToday() {
        onAnchorChange(new Date());
    }

    const views: { key: CalendarView; label: string }[] = [
        { key: 'list', label: 'List' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
    ];

    return (
        <header className="flex items-center gap-4 px-6 py-3 border-b border-navy/10 shrink-0">
            <h1 className="text-lg font-bold text-foreground mr-auto">Calendar</h1>

            {view !== 'list' && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={navigateBack}
                        className="rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground hover:bg-surface"
                    >
                        ‹
                    </button>
                    <span className="text-sm font-medium text-foreground min-w-35 text-center">
                        {view === 'month'
                            ? formatMonthYear(anchor)
                            : `${formatDayMonth(startOfWeek(anchor))} – ${formatDayMonth(addDays(startOfWeek(anchor), 6))}`}
                    </span>
                    <button
                        onClick={navigateForward}
                        className="rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground hover:bg-surface"
                    >
                        ›
                    </button>
                    <button
                        onClick={goToday}
                        className="rounded-lg border border-navy/10 px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
                    >
                        Today
                    </button>
                </div>
            )}

            <div className="flex rounded-lg border border-navy/10 overflow-hidden">
                {views.map((v) => (
                    <button
                        key={v.key}
                        onClick={() => onViewChange(v.key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                            view === v.key
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted hover:text-foreground hover:bg-surface'
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            <button
                onClick={onAdd}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
                + Add
            </button>
        </header>
    );
}

// ─── List View (infinite scroll by date, every date shown) ──────────

const INITIAL_PAST_DAYS = 30;
const INITIAL_FUTURE_DAYS = 60;
const LOAD_MORE_DAYS = 30;

function ListView({
    sessions,
    onSelect,
    onAddOnDate,
    scrollToTodayRef,
}: {
    sessions: Session[];
    onSelect: (id: string) => void;
    onAddOnDate: (date: string) => void;
    scrollToTodayRef?: React.RefObject<(() => void) | null>;
}) {
    const today = useMemo(() => new Date(), []);
    const todayStr = toDateString(today);

    const [pastDays, setPastDays] = useState(INITIAL_PAST_DAYS);
    const [futureDays, setFutureDays] = useState(INITIAL_FUTURE_DAYS);

    const sessionsByDate = useMemo(() => {
        const map = new Map<string, Session[]>();
        for (const s of sessions) {
            const arr = map.get(s.date) ?? [];
            arr.push(s);
            map.set(s.date, arr);
        }
        return map;
    }, [sessions]);

    // Generate all dates in range
    const dates = useMemo(() => {
        const result: string[] = [];
        const start = addDays(today, -pastDays);
        const totalDays = pastDays + futureDays + 1;
        for (let i = 0; i < totalDays; i++) {
            result.push(toDateString(addDays(start, i)));
        }
        return result;
    }, [pastDays, futureDays, today]);

    const todayRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hasScrolledToToday = useRef(false);

    // Scroll to today on first render
    useEffect(() => {
        if (!hasScrolledToToday.current && todayRef.current) {
            todayRef.current.scrollIntoView({ block: 'start' });
            hasScrolledToToday.current = true;
        }
    }, [dates]);

    // Expose scroll-to-today for external triggers (e.g. nav bar tap)
    useEffect(() => {
        if (!scrollToTodayRef) return;
        scrollToTodayRef.current = () => {
            todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        return () => { scrollToTodayRef.current = null; };
    }, [scrollToTodayRef]);

    // IntersectionObserver to load more dates at top/bottom
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    if (entry.target === topSentinelRef.current) {
                        const prevHeight = container.scrollHeight;
                        setPastDays((d) => d + LOAD_MORE_DAYS);
                        // Preserve scroll position after prepending
                        requestAnimationFrame(() => {
                            const newHeight = container.scrollHeight;
                            container.scrollTop += newHeight - prevHeight;
                        });
                    } else if (entry.target === bottomSentinelRef.current) {
                        setFutureDays((d) => d + LOAD_MORE_DAYS);
                    }
                }
            },
            { root: container, rootMargin: '200px' },
        );

        if (topSentinelRef.current) observer.observe(topSentinelRef.current);
        if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

        return () => observer.disconnect();
    }, [dates]);

    return (
        <div ref={scrollContainerRef} className="flex flex-col h-full overflow-y-auto">
            <div ref={topSentinelRef} className="h-1 shrink-0" />
            {dates.map((date) => {
                const d = new Date(date + 'T00:00:00');
                const isDateToday = date === todayStr;
                const daySessions = sessionsByDate.get(date) ?? [];
                return (
                    <div key={date} ref={isDateToday ? todayRef : undefined}>
                        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-2 ${
                            isDateToday ? 'bg-primary/10' : 'bg-surface'
                        }`}>
                            <span className={`text-xs font-semibold ${isDateToday ? 'text-primary' : 'text-muted'}`}>
                                {isDateToday ? 'Today' : d.toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                                })}
                            </span>
                            <button
                                onClick={() => onAddOnDate(date)}
                                className="text-xs text-primary hover:text-primary-dark font-medium"
                            >
                                +
                            </button>
                        </div>
                        {daySessions.length > 0 ? (
                            daySessions.map((session) => (
                                <SessionRow
                                    key={session.id}
                                    session={session}
                                    onClick={() => onSelect(session.id)}
                                />
                            ))
                        ) : (
                            <div className="px-6 py-3 border-b border-navy/5">
                                <span className="text-xs text-muted/50 italic">No sessions</span>
                            </div>
                        )}
                    </div>
                );
            })}
            <div ref={bottomSentinelRef} className="h-1 shrink-0" />
        </div>
    );
}

// ─── Session Row (used in list view) ────────────────────────────────

function SessionRow({ session, onClick }: { session: Session; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-6 py-3 w-full text-left hover:bg-surface/50 transition-colors border-b border-navy/5"
        >
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DISCIPLINE_COLORS[session.discipline]}`}>
                {DISCIPLINE_LABELS[session.discipline]}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{session.name}</span>
            <span className="ml-auto flex items-center gap-2 shrink-0">
                {session.totalDuration && (
                    <span className="text-xs text-muted">{session.totalDuration}min</span>
                )}
                {session.totalDistance && (
                    <span className="text-xs text-muted">{session.totalDistance}km</span>
                )}
            </span>
        </button>
    );
}

// ─── Week View ──────────────────────────────────────────────────────

function WeekView({
    anchor,
    sessionsByDate,
    onSelect,
    onAddOnDate,
}: {
    anchor: Date;
    sessionsByDate: Map<string, Session[]>;
    onSelect: (id: string) => void;
    onAddOnDate: (date: string) => void;
}) {
    const weekDates = getWeekDates(anchor);

    return (
        <div className="flex flex-col flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-navy/10 shrink-0">
                {weekDates.map((d) => {
                    const today = isToday(d);
                    return (
                        <div key={toDateString(d)} className="flex flex-col items-center py-2 border-r border-navy/5 last:border-r-0">
                            <span className="text-[10px] text-muted uppercase">{formatWeekday(d)}</span>
                            <span className={`text-sm font-semibold mt-0.5 ${
                                today ? 'text-primary' : 'text-foreground'
                            }`}>
                                {d.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Day columns */}
            <div className="grid grid-cols-7 flex-1">
                {weekDates.map((d) => {
                    const dateStr = toDateString(d);
                    const daySessions = sessionsByDate.get(dateStr) ?? [];
                    return (
                        <div
                            key={dateStr}
                            className="flex flex-col gap-1 p-1 border-r border-navy/5 last:border-r-0 min-h-50"
                        >
                            {daySessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => onSelect(s.id)}
                                    className={`rounded-md px-1.5 py-1 text-left text-xs font-medium truncate ${DISCIPLINE_COLORS[s.discipline]} hover:opacity-80 transition-opacity`}
                                >
                                    {s.name}
                                </button>
                            ))}
                            <button
                                onClick={() => onAddOnDate(dateStr)}
                                className="mt-auto rounded-md px-1.5 py-0.5 text-xs text-muted hover:text-primary hover:bg-primary/5 transition-colors opacity-0 hover:opacity-100"
                            >
                                +
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Month View ─────────────────────────────────────────────────────

function MonthView({
    anchor,
    sessionsByDate,
    onSelect,
    onAddOnDate,
}: {
    anchor: Date;
    sessionsByDate: Map<string, Session[]>;
    onSelect: (id: string) => void;
    onAddOnDate: (date: string) => void;
}) {
    const monthGrid = getMonthGrid(anchor.getFullYear(), anchor.getMonth());
    const currentMonth = anchor.getMonth();

    // Day-of-week headers
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex flex-col flex-1">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-navy/10 shrink-0">
                {dayHeaders.map((label) => (
                    <div key={label} className="text-center py-2 text-[10px] font-semibold text-muted uppercase border-r border-navy/5 last:border-r-0">
                        {label}
                    </div>
                ))}
            </div>
            {/* Calendar grid: 6 rows × 7 cols */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1">
                {monthGrid.map((d) => {
                    const dateStr = toDateString(d);
                    const inMonth = d.getMonth() === currentMonth;
                    const today = isToday(d);
                    const daySessions = sessionsByDate.get(dateStr) ?? [];

                    return (
                        <div
                            key={dateStr}
                            className={`flex flex-col border-r border-b border-navy/5 last:border-r-0 p-1 min-h-20 ${
                                inMonth ? '' : 'opacity-40'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                    today
                                        ? 'bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center'
                                        : 'text-muted'
                                }`}>
                                    {d.getDate()}
                                </span>
                                {inMonth && (
                                    <button
                                        onClick={() => onAddOnDate(dateStr)}
                                        className="text-xs text-muted hover:text-primary opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                                {daySessions.slice(0, 3).map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => onSelect(s.id)}
                                        className={`rounded px-1 py-0.5 text-[10px] font-medium truncate text-left ${DISCIPLINE_COLORS[s.discipline]} hover:opacity-80 transition-opacity`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                                {daySessions.length > 3 && (
                                    <span className="text-[10px] text-muted px-1">
                                        +{daySessions.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
