import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppShell: React.FC = () => {
    const { authUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const syncBrowserFullscreenClass = () => {
            document.documentElement.classList.toggle('is-browser-fullscreen', Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', syncBrowserFullscreenClass);
        document.addEventListener('webkitfullscreenchange', syncBrowserFullscreenClass);
        syncBrowserFullscreenClass();
        return () => {
            document.removeEventListener('fullscreenchange', syncBrowserFullscreenClass);
            document.removeEventListener('webkitfullscreenchange', syncBrowserFullscreenClass);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="app-shell">
            <header className="app-shell-header">
                <NavLink to="/home" className="app-shell-brand">
                    2D Tanks
                </NavLink>
                <nav className="app-shell-nav">
                    <NavLink to="/home" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
                        Главная
                    </NavLink>
                    <NavLink to="/play?menu=1" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Игра
                    </NavLink>
                    <NavLink to="/replays" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Повторы
                    </NavLink>
                    <NavLink to="/gallery" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Галерея
                    </NavLink>
                    <NavLink to="/watch" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Смотреть
                    </NavLink>
                    <NavLink to="/friends" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Друзья
                    </NavLink>
                    <NavLink to="/stats" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Статистика
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Профиль
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                        Настройки
                    </NavLink>
                </nav>
                <div className="app-shell-user">
                    {authUser && (
                        <>
                            <span className="app-shell-user-name">{authUser.displayName}</span>
                            <button type="button" className="app-shell-logout" onClick={handleLogout}>
                                Выйти
                            </button>
                        </>
                    )}
                </div>
            </header>
            <main className="app-shell-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AppShell;
