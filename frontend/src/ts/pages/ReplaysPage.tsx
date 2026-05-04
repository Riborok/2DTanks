import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReplaysScreen from '../components/ui/ReplaysScreen';

const ReplaysPage: React.FC = () => {
    const { accessToken } = useAuth();
    const navigate = useNavigate();

    if (!accessToken) {
        return null;
    }

    return (
        <div className="page-replays">
            <ReplaysScreen
                accessToken={accessToken}
                onBack={() => navigate('/home')}
                onPlayReplay={(replayId) => navigate(`/replays/watch/${encodeURIComponent(replayId)}`)}
            />
        </div>
    );
};

export default ReplaysPage;
