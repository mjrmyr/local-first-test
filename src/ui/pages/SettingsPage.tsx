import { useNavigate } from 'react-router-dom';
import { AnalyticsIcon, HomeIcon, SettingsIcon } from '../icons';

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
];

export function SettingsPage() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center px-6 py-4 border-b border-orange-100">
                <h1 className="text-lg font-bold text-gray-900">Settings</h1>
            </header>

            <main className="flex flex-col gap-3 px-6 py-8 max-w-lg mx-auto w-full">
                {options.map((option) => (
                    <button
                        key={option.to}
                        onClick={() => navigate(option.to)}
                        className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-orange-50 transition-colors"
                    >
                        <span className="flex items-center justify-center size-10 rounded-lg bg-orange-100 text-orange-600 shrink-0">
                            {option.icon}
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="size-4 text-gray-400 ml-auto shrink-0"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                ))}
            </main>
        </div>
    );
}
