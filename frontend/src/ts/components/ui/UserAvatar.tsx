import React, { useEffect, useState } from 'react';

function isLikelyImageUrl(s: string): boolean {
    const t = s.trim();
    if (t.length < 8) return false;
    return t.startsWith('http://') || t.startsWith('https://');
}

export interface UserAvatarProps {
    avatarUrl?: string | null;
    displayName: string;
    className?: string;
}

/** Аватар из профиля (URL) или буква имени. */
export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, displayName, className = '' }) => {
    const [imageFailed, setImageFailed] = useState(false);
    const url = (avatarUrl ?? '').trim();
    const showImage = isLikelyImageUrl(url) && !imageFailed;
    const initial = (displayName || '?').slice(0, 1).toUpperCase();

    useEffect(() => {
        setImageFailed(false);
    }, [url]);

    if (showImage) {
        return (
            <img
                className={`user-avatar user-avatar--img ${className}`.trim()}
                src={url}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <span className={`user-avatar user-avatar--placeholder ${className}`.trim()} aria-hidden="true">
            {initial}
        </span>
    );
};
