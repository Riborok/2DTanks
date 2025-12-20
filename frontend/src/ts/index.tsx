import React from 'react';
import ReactDOM from 'react-dom/client';
import OnlineApp from './components/ui/OnlineApp';

// Initialize React application
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <OnlineApp />
    );
}
