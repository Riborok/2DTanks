import React, { useEffect, useState } from 'react';
import { updateProfile } from '../auth/authApi';
import { useAuth } from '../context/AuthContext';

type ProfileFeedback = { kind: 'success' | 'error'; text: string } | null;

function isLikelyImageUrl(s: string): boolean {
    const t = s.trim();
    if (t.length < 8) return false;
    return t.startsWith('http://') || t.startsWith('https://');
}

const ProfilePage: React.FC = () => {
    const { authUser, accessToken, setAuthUserPreferredRole, setAuthUserAvatarUrl } = useAuth();
    const [prefRole, setPrefRole] = useState<'attacker' | 'defender' | ''>('');
    const [avatarUrlField, setAvatarUrlField] = useState('');
    const [feedback, setFeedback] = useState<ProfileFeedback>(null);
    const [profileBusy, setProfileBusy] = useState(false);
    const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);

    useEffect(() => {
        if (authUser?.preferredRole === 'attacker' || authUser?.preferredRole === 'defender') {
            setPrefRole(authUser.preferredRole);
        } else {
            setPrefRole('');
        }
        setAvatarUrlField(authUser?.avatarUrl ?? '');
    }, [authUser?.preferredRole, authUser?.avatarUrl, authUser?.login]);

    const trimmedAvatar = avatarUrlField.trim();
    useEffect(() => {
        setAvatarPreviewFailed(false);
    }, [trimmedAvatar]);

    const saveProfile = async () => {
        if (!accessToken) {
            return;
        }
        setProfileBusy(true);
        setFeedback(null);
        try {
            const trimmed = avatarUrlField.trim();
            const { profile } = await updateProfile(accessToken, {
                preferredRole: prefRole === '' ? null : prefRole,
                avatarUrl: trimmed === '' ? null : trimmed
            });
            setFeedback({ kind: 'success', text: 'Сохранено' });
            setAuthUserPreferredRole(profile?.preferredRole ?? null);
            setAuthUserAvatarUrl(profile?.avatarUrl ?? null);
        } catch (e) {
            setFeedback({
                kind: 'error',
                text: e instanceof Error ? e.message : 'Ошибка'
            });
        } finally {
            setProfileBusy(false);
        }
    };

    if (!authUser) {
        return null;
    }

    const showAvatarPreview = isLikelyImageUrl(trimmedAvatar) && !avatarPreviewFailed;

    return (
        <div className="page-profile">
            <div className="profile-screen">
                <div className="profile-panel">
                    <header className="profile-header">
                        <h1 className="profile-page-title">Профиль</h1>
                        <p className="profile-lead">
                            Аватар по прямой ссылке на изображение и роль по умолчанию в матчах. Изменения сохраняются на сервере после нажатия «Сохранить».
                        </p>
                    </header>

                    <div className="profile-identity">
                        {showAvatarPreview ? (
                            <div className="profile-avatar-wrap">
                                <img
                                    className="profile-avatar-preview"
                                    src={trimmedAvatar}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    onError={() => setAvatarPreviewFailed(true)}
                                />
                            </div>
                        ) : (
                            <div className="profile-avatar-placeholder" aria-hidden="true">
                                {(authUser.displayName || authUser.login).slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div className="profile-identity-text">
                            <p className="profile-display-line">
                                <strong>{authUser.displayName}</strong>
                                <span className="profile-login">@{authUser.login}</span>
                            </p>
                        </div>
                    </div>

                    <form
                        className="profile-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void saveProfile();
                        }}
                    >
                        <div className="profile-fields">
                            <div className="profile-field">
                                <label className="profile-label" htmlFor="profile-avatar">
                                    URL аватара
                                </label>
                                <input
                                    id="profile-avatar"
                                    className="profile-input"
                                    type="text"
                                    inputMode="url"
                                    autoComplete="url"
                                    placeholder="https://…"
                                    value={avatarUrlField}
                                    onChange={(e) => setAvatarUrlField(e.target.value)}
                                />
                            </div>

                            <div className="profile-field">
                                <label className="profile-label" htmlFor="profile-role">
                                    Предпочитаемая роль
                                </label>
                                <select
                                    id="profile-role"
                                    className="profile-select"
                                    value={prefRole}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '') {
                                            setPrefRole('');
                                        } else if (v === 'attacker' || v === 'defender') {
                                            setPrefRole(v);
                                        }
                                    }}
                                >
                                    <option value="">Не задано</option>
                                    <option value="attacker">Атакующий</option>
                                    <option value="defender">Защитник</option>
                                </select>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button
                                type="submit"
                                className="ui-btn ui-btn-primary profile-save-btn"
                                disabled={profileBusy}
                                aria-busy={profileBusy}
                            >
                                {profileBusy ? 'Сохранение…' : 'Сохранить'}
                            </button>
                        </div>
                    </form>

                    {feedback?.kind === 'error' && (
                        <div className="profile-feedback profile-feedback--error" role="alert">
                            {feedback.text}
                        </div>
                    )}
                    {feedback?.kind === 'success' && (
                        <div
                            className="profile-feedback profile-feedback--success"
                            role="status"
                            aria-live="polite"
                        >
                            {feedback.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
