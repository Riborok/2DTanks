import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RootRedirect: React.FC = () => {
    const { authRestored, accessToken } = useAuth();

    if (!authRestored) {
        return (
            <div className="page-loading app-container">
                <p className="page-loading-text">Загрузка…</p>
            </div>
        );
    }

    return <Navigate to={accessToken ? '/home' : '/login'} replace />;
};

export default RootRedirect;
