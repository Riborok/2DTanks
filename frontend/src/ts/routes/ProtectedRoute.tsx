import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
    const { authRestored, accessToken } = useAuth();
    const location = useLocation();

    if (!authRestored) {
        return (
            <div className="page-loading app-container">
                <p className="page-loading-text">Загрузка сессии…</p>
            </div>
        );
    }

    if (!accessToken) {
        const from = `${location.pathname}${location.search}`;
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
