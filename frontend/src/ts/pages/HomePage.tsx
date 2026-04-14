import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
    const { authUser } = useAuth();

    return (
        <div className="page-home">
            <h1 className="page-home-title">Добро пожаловать{authUser ? `, ${authUser.displayName}` : ''}</h1>
            <p className="page-home-lead">Выберите раздел</p>
            <div className="page-home-grid">
                <Link className="page-home-card" to="/play">
                    <span className="page-home-card-title">Играть онлайн</span>
                    <span className="page-home-card-desc">Комнаты и матч по сети</span>
                </Link>
                <Link className="page-home-card" to="/replays">
                    <span className="page-home-card-title">Реплеи</span>
                    <span className="page-home-card-desc">Записи матчей</span>
                </Link>
                <Link className="page-home-card" to="/stats">
                    <span className="page-home-card-title">Статистика</span>
                    <span className="page-home-card-desc">История и сводка</span>
                </Link>
                <Link className="page-home-card" to="/profile">
                    <span className="page-home-card-title">Профиль</span>
                    <span className="page-home-card-desc">Роль и аватар</span>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
