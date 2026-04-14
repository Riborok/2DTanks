import React, { useEffect, useState } from 'react';
import { updateProfile } from '../auth/authApi';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
    const { authUser, accessToken, setAuthUserPreferredRole, setAuthUserAvatarUrl } = useAuth();
    const [prefRole, setPrefRole] = useState<'attacker' | 'defender' | ''>('');
    const [avatarUrlField, setAvatarUrlField] = useState('');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileBusy, setProfileBusy] = useState(false);

    useEffect(() => {
        if (authUser?.preferredRole === 'attacker' || authUser?.preferredRole === 'defender') {
            setPrefRole(authUser.preferredRole);
        } else {
            setPrefRole('');
        }
        setAvatarUrlField(authUser?.avatarUrl ?? '');
    }, [authUser?.preferredRole, authUser?.avatarUrl, authUser?.login]);

    const saveProfile = async () => {
        if (!accessToken) {
            return;
        }
        setProfileBusy(true);
        setProfileMsg('');
        try {
            const trimmed = avatarUrlField.trim();
            const { profile } = await updateProfile(accessToken, {
                preferredRole: prefRole === '' ? null : prefRole,
                avatarUrl: trimmed === '' ? null : trimmed
            });
            setProfileMsg('Сохранено');
            setAuthUserPreferredRole(profile?.preferredRole ?? null);
            setAuthUserAvatarUrl(profile?.avatarUrl ?? null);
        } catch (e) {
            setProfileMsg(e instanceof Error ? e.message : 'Ошибка');
        } finally {
            setProfileBusy(false);
        }
    };

    if (!authUser) {
        return null;
    }

    return (
        <div className="page-profile">
            <h1 className="page-profile-title">Профиль</h1>
            <div className="page-profile-card">
                <p className="page-profile-line">
                    <strong>{authUser.displayName}</strong>
                    <span className="page-profile-login"> ({authUser.login})</span>
                </p>

                <label className="profile-mini-label" htmlFor="profile-avatar">
                    URL аватара
                </label>
                <input
                    id="profile-avatar"
                    className="auth-input"
                    placeholder="https://…"
                    value={avatarUrlField}
                    onChange={(e) => setAvatarUrlField(e.target.value)}
                />

                <label className="profile-mini-label" htmlFor="profile-role">
                    Предпочитаемая роль
                </label>
                <select
                    id="profile-role"
                    className="auth-input profile-select"
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

                <button
                    type="button"
                    className="auth-submit profile-save"
                    disabled={profileBusy}
                    onClick={() => void saveProfile()}
                >
                    {profileBusy ? '…' : 'Сохранить'}
                </button>
                {profileMsg && <div className="auth-hint profile-msg">{profileMsg}</div>}
            </div>
        </div>
    );
};

export default ProfilePage;
