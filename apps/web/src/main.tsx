import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { ToastProvider } from '@ilinga/ui';
import { ThemeProvider } from './lib/theme';
import { ConsentProvider } from './lib/consent';
import { AuthProvider } from './lib/auth';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

createRoot(el).render(
  <StrictMode>
    <ThemeProvider>
      <ConsentProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ConsentProvider>
    </ThemeProvider>
  </StrictMode>,
);
