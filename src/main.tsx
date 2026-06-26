import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/variables.css';
import './styles/global.css';
import './styles/animations.css';
import App from './App';

// Initialize theme before render to prevent flash
const stored = localStorage.getItem('pdf-forge-theme');
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    const mode = state?.mode ?? 'system';
    let resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
