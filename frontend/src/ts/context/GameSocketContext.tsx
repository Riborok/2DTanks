import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebSocketClient } from '../online/WebSocketClient';
import { useAuth } from './AuthContext';

/** Событие: немедленно присоединиться к комнате (работает даже если уже на /play). */
export const TANKS_PENDING_JOIN_ROOM_EVENT = 'tanks-pending-join-room';

/** После push по друзьям из WS — перезагрузить списки на странице «Друзья». */
export const TANKS_FRIENDS_LIST_SYNC_EVENT = 'tanks-friends-list-sync';

export type FriendsListSyncReason =
    | 'friends:accepted'
    | 'friends:incoming'
    | 'friends:became_friends'
    | 'friends:you_accepted';

export interface FriendsListSyncDetail {
    reason: FriendsListSyncReason;
    userId?: string;
    login?: string;
    displayName?: string;
}

export interface FriendInviteToast {
    id: string;
    roomCode: string;
    fromUserId: string;
    fromLogin: string;
    fromDisplayName: string;
    practiceMode: boolean;
    deathmatchMode: boolean;
    at: number;
}

type SocialToastKind = 'accepted' | 'incoming' | 'became' | 'you_accepted';

interface SocialToast {
    id: string;
    kind: SocialToastKind;
    primary: string;
}

function dispatchFriendsListSync(detail: FriendsListSyncDetail): void {
    try {
        window.dispatchEvent(new CustomEvent(TANKS_FRIENDS_LIST_SYNC_EVENT, { detail }));
    } catch {
        /* ignore */
    }
}

function displayNameOrLogin(displayName?: string, login?: string): string {
    const d = String(displayName || '').trim();
    if (d) return d;
    const l = String(login || '').trim();
    if (l) return l;
    return 'Игрок';
}

type GameSocketContextValue = {
    wsClient: WebSocketClient;
};

const GameSocketContext = createContext<GameSocketContextValue | null>(null);

export function useGameWebSocket(): GameSocketContextValue {
    const v = useContext(GameSocketContext);
    if (!v) {
        throw new Error('useGameWebSocket must be used within GameSocketProvider');
    }
    return v;
}

/** Опционально: на страницах без обязательного провайдера (редко). */
export function useGameWebSocketOptional(): GameSocketContextValue | null {
    return useContext(GameSocketContext);
}

const GlobalWsToasts: React.FC = () => {
    const navigate = useNavigate();
    const { wsClient } = useGameWebSocket();
    const [invites, setInvites] = useState<FriendInviteToast[]>([]);
    const [socialToasts, setSocialToasts] = useState<SocialToast[]>([]);

    useEffect(() => {
        const pushSocialToast = (kind: SocialToastKind, primary: string) => {
            const id = `soc-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const t: SocialToast = { id, kind, primary };
            setSocialToasts((prev) => [...prev.slice(-6), t]);
            window.setTimeout(() => {
                setSocialToasts((prev) => prev.filter((x) => x.id !== id));
            }, 6000);
        };

        const onInviteMsg = (message: any) => {
            if (message.type !== 'invite:msg') return;
            const roomCodeInv = String(message.roomCode || '');
            const fromUserId = String(message.fromUserId || '');
            if (!roomCodeInv || !fromUserId) return;
            const toast: FriendInviteToast = {
                id: `${fromUserId}-${roomCodeInv}-${message.at ?? Date.now()}`,
                roomCode: roomCodeInv,
                fromUserId,
                fromLogin: String(message.fromLogin || ''),
                fromDisplayName: String(message.fromDisplayName || ''),
                practiceMode: message.practiceMode === true,
                deathmatchMode: message.deathmatchMode === true,
                at: typeof message.at === 'number' ? message.at : Date.now()
            };
            setInvites((prev) => {
                const filtered = prev.filter(
                    (x) => !(x.fromUserId === toast.fromUserId && x.roomCode === toast.roomCode)
                );
                return [...filtered, toast];
            });
        };

        const onFriendsAccepted = (message: any) => {
            if (message.type !== 'friends:accepted') return;
            const displayName = String(message.friendDisplayName || '');
            const login = String(message.friendLogin || '');
            const userId = String(message.friendUserId || '');
            const primary = displayNameOrLogin(displayName, login);
            dispatchFriendsListSync({
                reason: 'friends:accepted',
                userId,
                login,
                displayName
            });
            pushSocialToast('accepted', primary);
        };

        const onFriendsIncoming = (message: any) => {
            if (message.type !== 'friends:incoming') return;
            const displayName = String(message.fromDisplayName || '');
            const login = String(message.fromLogin || '');
            const userId = String(message.fromUserId || '');
            const primary = displayNameOrLogin(displayName, login);
            dispatchFriendsListSync({
                reason: 'friends:incoming',
                userId,
                login,
                displayName
            });
            pushSocialToast('incoming', primary);
        };

        const onFriendsBecame = (message: any) => {
            if (message.type !== 'friends:became_friends') return;
            const displayName = String(message.peerDisplayName || '');
            const login = String(message.peerLogin || '');
            const userId = String(message.peerUserId || '');
            const primary = displayNameOrLogin(displayName, login);
            dispatchFriendsListSync({
                reason: 'friends:became_friends',
                userId,
                login,
                displayName
            });
            pushSocialToast('became', primary);
        };

        const onFriendsYouAccepted = (message: any) => {
            if (message.type !== 'friends:you_accepted') return;
            const displayName = String(message.friendDisplayName || '');
            const login = String(message.friendLogin || '');
            const userId = String(message.friendUserId || '');
            const primary = displayNameOrLogin(displayName, login);
            dispatchFriendsListSync({
                reason: 'friends:you_accepted',
                userId,
                login,
                displayName
            });
            pushSocialToast('you_accepted', primary);
        };

        wsClient.on('invite:msg', onInviteMsg as any);
        wsClient.on('friends:accepted', onFriendsAccepted as any);
        wsClient.on('friends:incoming', onFriendsIncoming as any);
        wsClient.on('friends:became_friends', onFriendsBecame as any);
        wsClient.on('friends:you_accepted', onFriendsYouAccepted as any);
        return () => {
            wsClient.off('invite:msg', onInviteMsg as any);
            wsClient.off('friends:accepted', onFriendsAccepted as any);
            wsClient.off('friends:incoming', onFriendsIncoming as any);
            wsClient.off('friends:became_friends', onFriendsBecame as any);
            wsClient.off('friends:you_accepted', onFriendsYouAccepted as any);
        };
    }, [wsClient]);

    const dismissInvite = (id: string) => setInvites((prev) => prev.filter((x) => x.id !== id));

    const goPlayWithJoin = (roomCode: string, inviteId: string) => {
        const code = roomCode.trim().toUpperCase();
        dismissInvite(inviteId);
        try {
            window.dispatchEvent(new CustomEvent(TANKS_PENDING_JOIN_ROOM_EVENT, { detail: { code } }));
        } catch {
            /* ignore */
        }
        void navigate('/play');
    };

    return (
        <>
            {(invites.length > 0 || socialToasts.length > 0) && (
                <div className="play-invite-stack play-invite-stack--global" aria-live="polite">
                    {socialToasts.map((t) => (
                        <div key={t.id} className="play-invite-toast play-invite-toast--social">
                            <div className="play-invite-toast-text">
                                {t.kind === 'accepted' && (
                                    <>
                                        <strong>{t.primary}</strong> принял(а) ваш запрос в друзья.
                                    </>
                                )}
                                {t.kind === 'incoming' && (
                                    <>
                                        <strong>{t.primary}</strong> хочет добавить вас в друзья.
                                    </>
                                )}
                                {t.kind === 'became' && (
                                    <>
                                        Вы и <strong>{t.primary}</strong> теперь друзья.
                                    </>
                                )}
                                {t.kind === 'you_accepted' && (
                                    <>
                                        В друзья добавлен(а): <strong>{t.primary}</strong>.
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {invites.map((inv) => (
                        <div key={inv.id} className="play-invite-toast">
                            <div className="play-invite-toast-text">
                                <strong>{inv.fromDisplayName || inv.fromLogin || 'Друг'}</strong> зовёт в комнату{' '}
                                <code>{inv.roomCode}</code>
                                {inv.deathmatchMode ? ' · арена' : inv.practiceMode ? ' · тренировка' : ''}
                            </div>
                            <div className="play-invite-toast-actions">
                                <button
                                    type="button"
                                    className="play-invite-btn play-invite-btn--primary"
                                    onClick={() => goPlayWithJoin(inv.roomCode, inv.id)}
                                >
                                    Играть
                                </button>
                                <button type="button" className="play-invite-btn" onClick={() => dismissInvite(inv.id)}>
                                    Скрыть
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export const GameSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tokenRef, authRestored, accessToken, authUser } = useAuth();
    const wsClientRef = useRef<WebSocketClient | null>(null);
    if (!wsClientRef.current) {
        wsClientRef.current = new WebSocketClient(undefined, () => tokenRef.current);
    }
    const wsClient = wsClientRef.current;

    const value = useMemo(() => ({ wsClient }), [wsClient]);

    useEffect(() => {
        if (!authRestored) {
            return;
        }
        if (!accessToken || !authUser) {
            // closeSocket, а не disconnect — сохраняем подписчиков (тосты, PlayPage)
            // и корректно закрываем сокет на сервере (снятие из реестра по userId).
            wsClient.closeSocket();
            return;
        }
        void wsClient.connect().catch((err) => {
            console.error('[GameSocket] connect failed', err);
        });
    }, [authRestored, accessToken, authUser?.userId, wsClient]);

    return (
        <GameSocketContext.Provider value={value}>
            {authRestored && accessToken && authUser ? <GlobalWsToasts /> : null}
            {children}
        </GameSocketContext.Provider>
    );
};
