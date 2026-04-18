import React from 'react';
import { KillEvent } from './useHudEvents';

const KillFeed: React.FC<{ kills: KillEvent[] }> = ({ kills }) => {
    if (kills.length === 0) return null;
    return (
        <div className="kill-feed" aria-hidden="true">
            {kills.map((k) => (
                <div key={k.id} className="kill-feed-row">
                    <span className="kill-feed-killer">{k.killerName}</span>
                    <span className="kill-feed-icon">×</span>
                    <span className="kill-feed-victim">{k.victimName}</span>
                </div>
            ))}
        </div>
    );
};

export default KillFeed;
