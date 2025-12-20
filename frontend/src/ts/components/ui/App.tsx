import React from 'react';
import TankCustomizer from './TankCustomizer';
import './App.css';

interface AppProps {
    onGameStart: () => void;
}

const App: React.FC<AppProps> = ({ onGameStart }) => {
    return (
        <div className="app-container">
            <TankCustomizer onAccept={onGameStart} />
        </div>
    );
};

export default App;
