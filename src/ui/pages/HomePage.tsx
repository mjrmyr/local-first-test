import { useNavigate } from 'react-router-dom';

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col bg-[#fff4e1]">
            <header className="flex items-center justify-between px-6 py-4 border-b border-orange-100">
                <h1 className="text-lg font-bold text-gray-900">kaeno</h1>
                <button
                    onClick={() => navigate('/profile')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    Profile
                </button>
            </header>
            <main className="flex flex-1 items-center justify-center">
                <p className="text-gray-500">Home — coming soon</p>
            </main>
        </div>
    );
}
