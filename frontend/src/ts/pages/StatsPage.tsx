import React, { useEffect, useMemo, useState } from 'react';
import { listMatchHistory, type MatchHistoryItemDto } from '../auth/gameApi';
import { useAuth } from '../context/AuthContext';

const StatsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [matches, setMatches] = useState<MatchHistoryItemDto[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) {
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError('');
        listMatchHistory(accessToken)
            .then(({ matches: m }) => {
                if (!cancelled) {
                    setMatches(m);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Ошибка загрузки');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const { wins, losses } = useMemo(() => {
        let w = 0;
        let l = 0;
        for (const m of matches) {
            if (m.isWinner) {
                w++;
            } else {
                l++;
            }
        }
        return { wins: w, losses: l };
    }, [matches]);

    const totals = useMemo(() => {
        const acc = {
            shots: 0,
            hits: 0,
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            deaths: 0,
            pickups: 0
        };
        for (const m of matches) {
            for (const s of m.matchStats) {
                acc.shots += Number(s.shotsFired) || 0;
                acc.hits += Number(s.shotsHit) || 0;
                acc.damageDealt += Number(s.damageDealt) || 0;
                acc.damageTaken += Number(s.damageTaken) || 0;
                acc.kills += Number(s.kills) || 0;
                acc.deaths += Number(s.deaths) || 0;
                acc.pickups += (Number(s.keyPickups) || 0) + (Number(s.ammoPickups) || 0);
            }
        }
        return acc;
    }, [matches]);

    const accuracy = useMemo(() => {
        if (totals.shots <= 0) {
            return 0;
        }
        return (totals.hits / totals.shots) * 100;
    }, [totals.hits, totals.shots]);

    const avgDamagePerMatch = useMemo(() => {
        if (matches.length === 0) {
            return 0;
        }
        return totals.damageDealt / matches.length;
    }, [matches.length, totals.damageDealt]);

    const winRate = useMemo(() => {
        const total = wins + losses;
        if (total === 0) {
            return 0;
        }
        return (wins / total) * 100;
    }, [wins, losses]);

    const lastTenWinRate = useMemo(() => {
        const last = matches.slice(0, 10);
        if (last.length === 0) {
            return 0;
        }
        const w = last.filter((m) => m.isWinner).length;
        return (w / last.length) * 100;
    }, [matches]);

    const bestDamageMatch = useMemo(() => {
        let best: { roomCode: string; damage: number } | null = null;
        for (const m of matches) {
            const matchDamage = m.matchStats.reduce((sum, s) => sum + (Number(s.damageDealt) || 0), 0);
            if (!best || matchDamage > best.damage) {
                best = {
                    roomCode: m.roomCode ?? 'Матч',
                    damage: matchDamage
                };
            }
        }
        return best;
    }, [matches]);

    return (
        <div className="page-stats">
            <h1 className="page-stats-title">Статистика</h1>
            <p className="page-stats-lead">История матчей по вашему аккаунту</p>

            {loading && <div className="replays-loading">Загрузка…</div>}
            {error && <div className="auth-form-error">{error}</div>}

            {!loading && !error && (
                <>
                    <div className="page-stats-summary page-stats-summary-grid">
                        <div className="page-stats-chip wins">Побед: {wins}</div>
                        <div className="page-stats-chip losses">Поражений: {losses}</div>
                        <div className="page-stats-chip total">Винрейт: {winRate.toFixed(1)}%</div>
                        <div className="page-stats-chip total">Точность: {accuracy.toFixed(1)}%</div>
                        <div className="page-stats-chip total">Матчей: {matches.length}</div>
                    </div>

                    {matches.length === 0 ? (
                        <p className="page-stats-empty">Пока нет завершённых матчей в базе для вашего аккаунта.</p>
                    ) : (
                        <div className="page-stats-analytics-grid">
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">Средний урон за матч</div>
                                <div className="page-stats-analytics-value">{avgDamagePerMatch.toFixed(0)}</div>
                            </div>
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">Последние 10 матчей</div>
                                <div className="page-stats-analytics-value">{lastTenWinRate.toFixed(1)}% побед</div>
                            </div>
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">K / D</div>
                                <div className="page-stats-analytics-value">
                                    {totals.kills} / {totals.deaths}
                                </div>
                            </div>
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">Суммарный урон</div>
                                <div className="page-stats-analytics-value">{totals.damageDealt}</div>
                            </div>
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">Полученный урон</div>
                                <div className="page-stats-analytics-value">{totals.damageTaken}</div>
                            </div>
                            <div className="page-stats-analytics-card">
                                <div className="page-stats-analytics-label">Подборы бонусов</div>
                                <div className="page-stats-analytics-value">{totals.pickups}</div>
                            </div>
                        </div>
                    )}

                    {matches.length > 0 && (
                        <div className="page-stats-insights">
                            <p>
                                Лучший матч по нанесенному урону:{' '}
                                <strong>
                                    {bestDamageMatch?.roomCode ?? '—'} ({bestDamageMatch?.damage ?? 0})
                                </strong>
                            </p>
                            <p className="page-stats-note">
                                Детали по каждому матчу смотри в разделе <strong>«Реплеи и история»</strong>.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StatsPage;
