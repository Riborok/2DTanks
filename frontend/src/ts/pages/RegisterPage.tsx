import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
    const { register, authBusy } = useAuth();
    const navigate = useNavigate();
    const [loginField, setLoginField] = useState('');
    const [emailField, setEmailField] = useState('');
    const [passwordField, setPasswordField] = useState('');
    const [displayNameField, setDisplayNameField] = useState('');
    const [formError, setFormError] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            await register(loginField.trim(), emailField.trim(), passwordField, displayNameField.trim());
            navigate('/home', { replace: true });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Ошибка регистрации');
        }
    };

    return (
        <div className="page-auth connection-screen">
            <div className="connection-container">
                <h1 className="game-title">Регистрация</h1>
                <p className="auth-lead">Создайте аккаунт, чтобы сохранять реплеи и видеть личную статистику матчей.</p>
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
                        placeholder="Email"
                        type="email"
                        value={emailField}
                        onChange={(e) => setEmailField(e.target.value)}
                        autoComplete="email"
                    />
                    <input
                        className="auth-input"
                        placeholder="Имя в игре"
                        value={displayNameField}
                        onChange={(e) => setDisplayNameField(e.target.value)}
                        autoComplete="nickname"
                    />
                    <input
                        className="auth-input"
                        placeholder="Пароль"
                        type="password"
                        value={passwordField}
                        onChange={(e) => setPasswordField(e.target.value)}
                        autoComplete="new-password"
                    />
                    {formError && <div className="auth-form-error">{formError}</div>}
                    <button type="submit" className="auth-submit ui-btn ui-btn-primary" disabled={authBusy}>
                        {authBusy ? '…' : 'Зарегистрироваться'}
                    </button>
                    <p className="auth-hint">
                        Уже есть аккаунт? <Link to="/login">Войти</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
