import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TANKS_FRIENDS_LIST_SYNC_EVENT } from '../context/GameSocketContext';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
    getFriends,
    sendFriendRequestApi,
    acceptFriendApi,
    rejectFriendApi,
    removeFriendApi,
    blockUserApi,
    unblockUserApi,
    searchUsers,
    type FriendDto,
    type FriendsListDto,
    type UserSearchDto
} from '../auth/gameApi';

type Tab = 'friends' | 'incoming' | 'outgoing' | 'blocked' | 'search';

const EMPTY_LIST: FriendsListDto = { friends: [], incoming: [], outgoing: [], blocked: [] };

const FriendsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [tab, setTab] = useState<Tab>('friends');
    const [data, setData] = useState<FriendsListDto>(EMPTY_LIST);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchDto[]>([]);
    const [searching, setSearching] = useState(false);

    const reload = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            const d = await getFriends(accessToken);
            setData(d);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        void reload();
    }, [reload]);

    useEffect(() => {
        const onFriendsListSync = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.reason === 'friends:status_change') {
                const { userId, isOnline } = detail;
                setData(prev => {
                    const updateList = (list: FriendDto[]) => list.map(f => 
                        f.userId === userId ? { ...f, isOnline } : f
                    );
                    return {
                        ...prev,
                        friends: updateList(prev.friends),
                        incoming: updateList(prev.incoming),
                        outgoing: updateList(prev.outgoing),
                        blocked: updateList(prev.blocked)
                    };
                });
                
                setSearchResults(prev => prev.map(u => 
                    u.userId === userId ? { ...u, isOnline } : u
                ));
            } else {
                void reload();
            }
        };
        window.addEventListener(TANKS_FRIENDS_LIST_SYNC_EVENT, onFriendsListSync);
        return () => window.removeEventListener(TANKS_FRIENDS_LIST_SYNC_EVENT, onFriendsListSync);
    }, [reload]);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(id);
    }, [toast]);

    const counts = useMemo(
        () => ({
            friends: data.friends.length,
            incoming: data.incoming.length,
            outgoing: data.outgoing.length,
            blocked: data.blocked.length
        }),
        [data]
    );

    useEffect(() => {
        if (tab !== 'search' || !accessToken) return;
        const q = searchQuery.trim();
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        const tid = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchUsers(accessToken, q);
                setSearchResults(res);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка поиска');
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(tid);
    }, [searchQuery, tab, accessToken]);

    const doAction = useCallback(
        async (
            fn: (token: string, userId: string) => Promise<unknown>,
            userId: string,
            okMessage: string
        ) => {
            if (!accessToken) return;
            try {
                await fn(accessToken, userId);
                setToast(okMessage);
                await reload();
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка');
            }
        },
        [accessToken, reload]
    );

    if (!accessToken) return null;

    return (
        <div className="page-friends">
            {toast && <div className="friends-toast">{toast}</div>}
            <div className="friends-screen">
                <div className="friends-panel">
                    <header className="friends-header">
                        <h1 className="friends-page-title">Друзья</h1>
                        <p className="friends-lead">
                            Список друзей, заявки и поиск игроков. Действия синхронизируются с сервером.
                        </p>
                    </header>

                    {error && (
                        <div className="friends-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="friends-tabs" role="tablist" aria-label="Разделы друзей">
                        <TabBtn selected={tab === 'friends'} onClick={() => setTab('friends')}>
                            Мои друзья ({counts.friends})
                        </TabBtn>
                        <TabBtn selected={tab === 'incoming'} onClick={() => setTab('incoming')}>
                            Входящие ({counts.incoming})
                        </TabBtn>
                        <TabBtn selected={tab === 'outgoing'} onClick={() => setTab('outgoing')}>
                            Отправленные ({counts.outgoing})
                        </TabBtn>
                        <TabBtn selected={tab === 'blocked'} onClick={() => setTab('blocked')}>
                            Заблокированы ({counts.blocked})
                        </TabBtn>
                        <TabBtn selected={tab === 'search'} onClick={() => setTab('search')}>
                            Найти друга
                        </TabBtn>
                    </div>

                    {loading && (
                        <div className="friends-loading" aria-busy="true">
                            <span className="friends-loading-dot" />
                            <span className="friends-loading-dot" />
                            <span className="friends-loading-dot" />
                            <span className="friends-loading-text">Загрузка…</span>
                        </div>
                    )}

                    {!loading && tab === 'friends' && (
                        <FriendList
                            items={data.friends}
                            emptyText="У вас пока нет друзей. Найдите и добавьте игроков во вкладке «Найти друга»."
                            renderActions={(f) => (
                                <>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-secondary friends-row-btn"
                                        onClick={() => void doAction(removeFriendApi, f.userId, 'Удалён из друзей')}
                                    >
                                        Удалить
                                    </button>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-secondary friends-row-btn friends-row-btn--danger"
                                        onClick={() => void doAction(blockUserApi, f.userId, 'Заблокирован')}
                                    >
                                        Заблокировать
                                    </button>
                                </>
                            )}
                        />
                    )}

                    {!loading && tab === 'incoming' && (
                        <FriendList
                            items={data.incoming}
                            emptyText="Нет входящих запросов."
                            renderActions={(f) => (
                                <>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-primary friends-row-btn"
                                        onClick={() => void doAction(acceptFriendApi, f.userId, 'Запрос принят')}
                                    >
                                        Принять
                                    </button>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-secondary friends-row-btn"
                                        onClick={() => void doAction(rejectFriendApi, f.userId, 'Запрос отклонён')}
                                    >
                                        Отклонить
                                    </button>
                                </>
                            )}
                        />
                    )}

                    {!loading && tab === 'outgoing' && (
                        <FriendList
                            items={data.outgoing}
                            emptyText="Нет исходящих запросов."
                            renderActions={(f) => (
                                <button
                                    type="button"
                                    className="ui-btn ui-btn-secondary friends-row-btn"
                                    onClick={() => void doAction(removeFriendApi, f.userId, 'Отменено')}
                                >
                                    Отменить
                                </button>
                            )}
                        />
                    )}

                    {!loading && tab === 'blocked' && (
                        <FriendList
                            items={data.blocked}
                            emptyText="Вы никого не заблокировали."
                            renderActions={(f) => (
                                <button
                                    type="button"
                                    className="ui-btn ui-btn-secondary friends-row-btn"
                                    onClick={() => void doAction(unblockUserApi, f.userId, 'Разблокирован')}
                                >
                                    Разблокировать
                                </button>
                            )}
                        />
                    )}

                    {!loading && tab === 'search' && (
                        <div className="friends-search">
                            <input
                                className="friends-search-input"
                                type="text"
                                placeholder="Введите логин или имя (от 2 символов)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {searching && (
                                <div className="friends-search-loading" aria-busy="true">
                                    <span className="friends-loading-dot" />
                                    <span className="friends-loading-dot" />
                                    <span className="friends-loading-dot" />
                                    <span className="friends-loading-text">Поиск…</span>
                                </div>
                            )}
                            {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                                <div className="friends-empty">Никого не нашлось.</div>
                            )}
                            <ul className="friends-list">
                                {searchResults.map((u) => (
                                    <li key={u.userId} className="friends-item">
                                        <div className="friends-item-main">
                                        <UserAvatar
                                            className="friends-item-avatar"
                                            avatarUrl={u.avatarUrl}
                                            displayName={u.displayName || u.login}
                                        />
                                        <div className="friends-item-name">
                                            <div className="friends-item-name-header">
                                                <strong>{u.displayName || u.login}</strong>
                                                {u.isOnline ? (
                                                    <span className="friends-item-online-badge">В сети</span>
                                                ) : (
                                                    <span className="friends-item-offline-badge">Не в сети</span>
                                                )}
                                            </div>
                                            <span className="friends-item-login">@{u.login}</span>
                                        </div>
                                        </div>
                                        <div className="friends-item-actions">
                                            <button
                                                type="button"
                                                className="ui-btn ui-btn-primary friends-row-btn"
                                                onClick={() => void doAction(sendFriendRequestApi, u.userId, 'Запрос отправлен')}
                                            >
                                                Добавить
                                            </button>
                                            <button
                                                type="button"
                                                className="ui-btn ui-btn-secondary friends-row-btn friends-row-btn--danger"
                                                onClick={() => void doAction(blockUserApi, u.userId, 'Заблокирован')}
                                            >
                                                Заблокировать
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TabBtn: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
    selected,
    onClick,
    children
}) => (
    <button
        type="button"
        role="tab"
        aria-selected={selected}
        className={selected ? 'friends-tab friends-tab--active' : 'friends-tab'}
        onClick={onClick}
    >
        {children}
    </button>
);

interface FriendListProps {
    items: FriendDto[];
    emptyText: string;
    renderActions: (f: FriendDto) => React.ReactNode;
}
const FriendList: React.FC<FriendListProps> = ({ items, emptyText, renderActions }) => {
    if (items.length === 0) return <div className="friends-empty">{emptyText}</div>;
    return (
        <ul className="friends-list">
            {items.map((f) => (
                <li key={f.userId + f.status} className="friends-item">
                    <div className="friends-item-main">
                    <UserAvatar
                        className="friends-item-avatar"
                        avatarUrl={f.avatarUrl}
                        displayName={f.displayName || f.login}
                    />
                    <div className="friends-item-name">
                        <div className="friends-item-name-header">
                            <strong>{f.displayName || f.login}</strong>
                            {f.isOnline ? (
                                <span className="friends-item-online-badge">В сети</span>
                            ) : (
                                <span className="friends-item-offline-badge">Не в сети</span>
                            )}
                        </div>
                        <span className="friends-item-login">@{f.login}</span>
                    </div>
                    </div>
                    <div className="friends-item-actions">{renderActions(f)}</div>
                </li>
            ))}
        </ul>
    );
};

export default FriendsPage;
