import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    {/* HashRouter: GitHub Pages has no SPA fallback, so deep links must live in the hash */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
