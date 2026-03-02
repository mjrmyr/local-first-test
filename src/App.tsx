import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { athleteService } from './application/athleteService';
import { Layout } from './ui/components/Layout';
import { AnalyticsPage } from './ui/pages/AnalyticsPage';
import { CalendarPage } from './ui/pages/CalendarPage';
import { HomePage } from './ui/pages/HomePage';
import { OnboardingPage } from './ui/pages/OnboardingPage';
import { ProfilePage } from './ui/pages/ProfilePage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { ThresholdsPage } from './ui/pages/ThresholdsPage';
import { TrainingZonesPage } from './ui/pages/TrainingZonesPage';

type AppStatus = 'loading' | 'onboarding' | 'ready';

function ReadyLayout() {
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
}

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
                element={
                    status === 'ready' ? <ReadyLayout /> : <Navigate to="/onboarding" replace />
                }
            >
                <Route path="/" element={<HomePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/training-zones" element={<TrainingZonesPage />} />
                <Route path="/thresholds" element={<ThresholdsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
