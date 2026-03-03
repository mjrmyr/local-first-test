import { useNavigate } from 'react-router-dom';
import { AnalyticsIcon, CalendarIcon, HomeIcon, SettingsIcon } from '../icons';

type SettingsOption = {
    label: string;
    description: string;
    to: string;
    icon: React.ReactNode;
};

const options: SettingsOption[] = [
    {
        label: 'General',
        description: 'Personal info, weight, height',
        to: '/profile',
        icon: <HomeIcon className="size-5" />,
    },
    {
        label: 'Training Zones',
        description: 'Heart rate and pace zones per discipline',
        to: '/training-zones',
        icon: <AnalyticsIcon className="size-5" />,
    },
    {
        label: 'Thresholds',
        description: 'FTP, lactate threshold and CSS values',
        to: '/thresholds',
        icon: <SettingsIcon className="size-5" />,
    },
    {
        label: 'Workout Library',
        description: 'Reusable workout templates',
        to: '/workouts',
        icon: <CalendarIcon className="size-5" />,
    },
];

export function SettingsPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col bg-canvas">
            <header className="flex items-center px-6 py-4 border-b border-navy/10">
                <h1 className="text-lg font-bold text-foreground">Settings</h1>
            </header>

            <main className="flex flex-col gap-3 px-6 py-8 max-w-lg mx-auto w-full">
                {options.map((option) => (
                    <button
                        key={option.to}
                        onClick={() => navigate(option.to)}
                        className="flex items-center gap-4 rounded-xl border border-navy/10 bg-surface px-4 py-4 text-left hover:bg-primary/10 transition-colors"
                    >
                        <span className="flex items-center justify-center size-10 rounded-lg bg-primary/15 text-primary shrink-0">
                            {option.icon}
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground">{option.label}</span>
                            <span className="text-xs text-muted mt-0.5">{option.description}</span>
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="size-4 text-muted ml-auto shrink-0"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                ))}
            </main>
        </div>
    );
}
