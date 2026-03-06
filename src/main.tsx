import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Apply saved theme before first paint to prevent flash
try {
  const saved = localStorage.getItem('kuntapeli-theme');
  if (saved === 'light') {
    document.documentElement.dataset.theme = 'light';
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
