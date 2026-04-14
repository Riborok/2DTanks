import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute: React.FC = () => {
    const { authRestored, accessToken } = useAuth();

    if (!authRestored) {
        return (
            <div className="page-loading app-container">
                <p className="page-loading-text">Загрузка…</p>
            </div>
        );
    }

    if (accessToken) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
};

export default GuestRoute;
