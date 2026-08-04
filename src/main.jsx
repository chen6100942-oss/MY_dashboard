import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './final-overrides.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

const loader = document.getElementById('static-loader');
if (loader) loader.remove();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: './' })
        .then(() => console.log('✅ Service Worker registered'))
        .catch(err => console.warn('SW registration failed:', err));
}
