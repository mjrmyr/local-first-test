import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { athleteService } from './application/athleteService';
import { HomePage } from './ui/pages/HomePage';
import { OnboardingPage } from './ui/pages/OnboardingPage';
import { ProfilePage } from './ui/pages/ProfilePage';

type AppStatus = 'loading' | 'onboarding' | 'ready';

function App() {
    const [status, setStatus] = useState<AppStatus>('loading');

    useEffect(() => {
        athleteService.getActive().then((result) => {
            if (result.ok && result.data !== null) {
                setStatus('ready');
            } else {
                setStatus('onboarding');
            }
        });
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fff4e1]">
                <span className="text-gray-400">Loading…</span>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/onboarding"
                element={
                    status === 'onboarding' ? (
                        <OnboardingPage onComplete={() => setStatus('ready')} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
            <Route
                path="/"
                element={
                    status === 'ready' ? <HomePage /> : <Navigate to="/onboarding" replace />
                }
            />
            <Route
                path="/profile"
                element={
                    status === 'ready' ? <ProfilePage /> : <Navigate to="/onboarding" replace />
                }
            />
        </Routes>
    );
}

export default App;
