import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/ui/App';
import {GameModeManager} from "./game/game mode/GameModeManager";
import {TankInfo} from "./additionally/type";

// Функция для запуска игры
const startGame = () => {
    const root = document.getElementById('root');
    if (root) {
        root.style.display = 'none';
    }

    // Получаем конфигурацию танка из localStorage
    const configStr = localStorage.getItem('tankConfig');
    const config = configStr ? JSON.parse(configStr) : {
        hullIndex: 0,
        trackIndex: 0,
        turretIndex: 0,
        weaponIndex: 0,
        colorIndex: 0
    };

    // Создаем TankInfo для игрока и противника
    const playerTankInfo: TankInfo = {
        color: config.colorIndex,
        hullNum: config.hullIndex,
        trackNum: config.trackIndex,
        turretNum: config.turretIndex,
        weaponNum: config.weaponIndex,
        control: {
            forwardKey: 87,                      // W
            backwardKey: 83,                     // S
            hullClockwiseKey: 68,                // D
            hullCounterClockwiseKey: 65,         // A
            turretClockwiseKey: 69,              // E
            turretCounterClockwiseKey: 81,       // Q
            shootKey: 32                         // Space
        }
    };

    // Противник с другой конфигурацией
    const enemyTankInfo: TankInfo = {
        color: (config.colorIndex + 4) % 8,
        hullNum: (config.hullIndex + 1) % 8,
        trackNum: (config.trackIndex + 1) % 4,
        turretNum: (config.turretIndex + 1) % 8,
        weaponNum: (config.weaponIndex + 1) % 8,
        control: {
            forwardKey: 38,                      // Arrow Up
            backwardKey: 40,                     // Arrow Down
            hullClockwiseKey: 39,                // Arrow Right
            hullCounterClockwiseKey: 37,         // Arrow Left
            turretClockwiseKey: 107,             // Numpad +
            turretCounterClockwiseKey: 109,      // Numpad -
            shootKey: 13                         // Enter
        }
    };

    GameModeManager.gameStart(playerTankInfo, enemyTankInfo);
};

// Инициализация React приложения
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App onGameStart={startGame} />
        </React.StrictMode>
    );
}
