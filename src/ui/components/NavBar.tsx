import { useLocation, useNavigate } from 'react-router-dom';
import { AnalyticsIcon, CalendarIcon, HomeIcon, SettingsIcon } from '../icons';

const navItems = [
    { label: 'Home', to: '/', icon: <HomeIcon /> },
    { label: 'Calendar', to: '/calendar', icon: <CalendarIcon /> },
    { label: 'Analytics', to: '/analytics', icon: <AnalyticsIcon /> },
    { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
];

function getActiveItem(pathname: string): string {
    if (pathname === '/') return '/';
    if (pathname.startsWith('/calendar')) return '/calendar';
    if (pathname.startsWith('/analytics')) return '/analytics';
    if (
        pathname.startsWith('/settings') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/training-zones') ||
        pathname.startsWith('/thresholds')
    )
        return '/settings';
    return '/';
}

/** Horizontal top bar — shown on lg+ (desktop). */
export function TopNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeItem = getActiveItem(location.pathname);

    return (
        <nav className="hidden lg:flex shrink-0 items-center gap-1 border-b border-orange-100 bg-white px-6 h-14">
            <span className="mr-6 text-lg font-bold text-gray-900">kaeno</span>
            {navItems.map((item) => {
                const isActive = item.to === activeItem;
                return (
                    <button
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );
}

/** Full-width bottom tab bar — shown below lg (mobile & tablet). */
export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeItem = getActiveItem(location.pathname);

    return (
        <nav className="lg:hidden shrink-0 flex items-stretch border-t border-orange-100 bg-white h-16">
            {navItems.map((item) => {
                const isActive = item.to === activeItem;
                return (
                    <button
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                            isActive ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );
}
