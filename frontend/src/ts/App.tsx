import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RootRedirect from './routes/RootRedirect';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PlayPage from './pages/PlayPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ReplaysPage from './pages/ReplaysPage';
import ReplayWatchPage from './pages/ReplayWatchPage';
import StatsPage from './pages/StatsPage';
import './styles/index.css';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/play" element={<PlayPage />} />
                    <Route path="/replays" element={<ReplaysPage />} />
                    <Route path="/replays/watch/:replayId" element={<ReplayWatchPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
};

export default App;
