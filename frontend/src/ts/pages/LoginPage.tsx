import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function safeReturnPath(from: unknown): string | null {
    if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
        return null;
    }
    if (from === '/login' || from === '/register') {
        return null;
    }
    return from;
}

const LoginPage: React.FC = () => {
    const { login, authBusy } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loginField, setLoginField] = useState('');
    const [passwordField, setPasswordField] = useState('');
    const [formError, setFormError] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            await login(loginField.trim(), passwordField);
            const from = safeReturnPath((location.state as { from?: string } | null)?.from);
            navigate(from ?? '/home', { replace: true });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Ошибка входа');
        }
    };

    return (
        <div className="page-auth connection-screen">
            <div className="connection-container">
                <h1 className="game-title">Вход</h1>
                <p className="auth-lead">Войдите в аккаунт, чтобы продолжить игру и смотреть историю матчей.</p>
                <form className="auth-form" onSubmit={(e) => void submit(e)}>
                    <input
                        className="auth-input"
                        placeholder="Логин"
                        value={loginField}
                        onChange={(e) => setLoginField(e.target.value)}
                        autoComplete="username"
                    />
                    <input
                        className="auth-input"
                        placeholder="Пароль"
                        type="password"
                        value={passwordField}
                        onChange={(e) => setPasswordField(e.target.value)}
                        autoComplete="current-password"
                    />
                    {formError && <div className="auth-form-error">{formError}</div>}
                    <button type="submit" className="auth-submit ui-btn ui-btn-primary" disabled={authBusy}>
                        {authBusy ? '…' : 'Войти'}
                    </button>
                    <p className="auth-hint">
                        Нет аккаунта? <Link to="/register">Регистрация</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
