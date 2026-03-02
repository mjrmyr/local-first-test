import { useLocation, useNavigate } from 'react-router-dom';

// TODO: Refactor the icons into separate icon components (separate /icon directory within ui directory)
const navItems = [
    {
        label: 'Home',
        to: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
    },
    {
        label: 'Calendar',
        to: '/calendar',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
        ),
    },
    {
        label: 'Analytics',
        to: '/analytics',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
    },
    {
        label: 'Profile',
        to: '/profile',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        ),
    },
];

// TODO: Refactor the active item logic to be more robust (e.g. using a mapping of path prefixes to nav items, or using React Router's matchPath function)
function getActiveItem(pathname: string): string {
    if (pathname === '/') return '/';
    if (pathname.startsWith('/calendar')) return '/calendar';
    if (pathname.startsWith('/analytics')) return '/analytics';
    if (
        pathname.startsWith('/profile') ||
        pathname.startsWith('/training-zones') ||
        pathname.startsWith('/thresholds')
    )
        return '/profile';
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
