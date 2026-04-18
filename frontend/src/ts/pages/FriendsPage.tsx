import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TANKS_FRIENDS_LIST_SYNC_EVENT } from '../context/GameSocketContext';
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
        const onFriendsListSync = () => {
            void reload();
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

    // Поиск с дебаунсом, чтобы не долбить API
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
        <div className="friends-page">
            <h1 className="friends-title">Друзья</h1>

            {error && (
                <div className="friends-error" role="alert">
                    {error}
                </div>
            )}
            {toast && <div className="friends-toast">{toast}</div>}

            <div className="friends-tabs">
                <TabBtn active={tab === 'friends'} onClick={() => setTab('friends')}>
                    Мои друзья ({counts.friends})
                </TabBtn>
                <TabBtn active={tab === 'incoming'} onClick={() => setTab('incoming')}>
                    Входящие ({counts.incoming})
                </TabBtn>
                <TabBtn active={tab === 'outgoing'} onClick={() => setTab('outgoing')}>
                    Отправленные ({counts.outgoing})
                </TabBtn>
                <TabBtn active={tab === 'blocked'} onClick={() => setTab('blocked')}>
                    Заблокированы ({counts.blocked})
                </TabBtn>
                <TabBtn active={tab === 'search'} onClick={() => setTab('search')}>
                    Найти друга
                </TabBtn>
            </div>

            {loading && <div className="friends-loading">Загрузка…</div>}

            {!loading && tab === 'friends' && (
                <FriendList
                    items={data.friends}
                    emptyText="У вас пока нет друзей. Найдите и добавьте игроков во вкладке «Найти друга»."
                    renderActions={(f) => (
                        <>
                            <button className="friends-btn" onClick={() => doAction(removeFriendApi, f.userId, 'Удалён из друзей')}>
                                Удалить
                            </button>
                            <button
                                className="friends-btn friends-btn--danger"
                                onClick={() => doAction(blockUserApi, f.userId, 'Заблокирован')}
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
                            <button className="friends-btn friends-btn--primary" onClick={() => doAction(acceptFriendApi, f.userId, 'Запрос принят')}>
                                Принять
                            </button>
                            <button className="friends-btn" onClick={() => doAction(rejectFriendApi, f.userId, 'Запрос отклонён')}>
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
                        <button className="friends-btn" onClick={() => doAction(removeFriendApi, f.userId, 'Отменено')}>
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
                        <button className="friends-btn" onClick={() => doAction(unblockUserApi, f.userId, 'Разблокирован')}>
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
                    {searching && <div className="friends-loading">Поиск…</div>}
                    {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                        <div className="friends-empty">Никого не нашлось.</div>
                    )}
                    <ul className="friends-list">
                        {searchResults.map((u) => (
                            <li key={u.userId} className="friends-item">
                                <div className="friends-item-name">
                                    <strong>{u.displayName || u.login}</strong>
                                    <span className="friends-item-login">@{u.login}</span>
                                </div>
                                <div className="friends-item-actions">
                                    <button
                                        className="friends-btn friends-btn--primary"
                                        onClick={() => doAction(sendFriendRequestApi, u.userId, 'Запрос отправлен')}
                                    >
                                        Добавить
                                    </button>
                                    <button
                                        className="friends-btn friends-btn--danger"
                                        onClick={() => doAction(blockUserApi, u.userId, 'Заблокирован')}
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
    );
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" className={`friends-tab${active ? ' friends-tab--active' : ''}`} onClick={onClick}>
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
                    <div className="friends-item-name">
                        <strong>{f.displayName || f.login}</strong>
                        <span className="friends-item-login">@{f.login}</span>
                    </div>
                    <div className="friends-item-actions">{renderActions(f)}</div>
                </li>
            ))}
        </ul>
    );
};

export default FriendsPage;
