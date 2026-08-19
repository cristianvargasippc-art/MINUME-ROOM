import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// El tema se aplica antes del primer render para evitar el parpadeo de color.
// Va en JS del bundle (no en línea) para no romper la CSP de producción.
const storedTheme = localStorage.getItem('minume-theme') || 'dark';
document.documentElement.dataset.theme = storedTheme;

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
