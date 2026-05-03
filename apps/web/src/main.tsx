import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { ToastProvider } from '@ilinga/ui';
import { ThemeProvider } from './lib/theme';
import { ConsentProvider } from './lib/consent';
import { AuthProvider } from './lib/auth';
import { TenantProvider } from './lib/tenant';
import { CommandPaletteProvider } from './features/palette/CommandPalette';
import { BrowserRouter } from 'react-router-dom';

const el = document.getElementById('root');
if (!el) throw new Error('#root not found');

createRoot(el).render(
  <StrictMode>
    <ThemeProvider>
      <ConsentProvider>
        <ToastProvider>
          <AuthProvider>
            <TenantProvider>
              <BrowserRouter>
                <CommandPaletteProvider>
                  <App />
                </CommandPaletteProvider>
              </BrowserRouter>
            </TenantProvider>
          </AuthProvider>
        </ToastProvider>
      </ConsentProvider>
    </ThemeProvider>
  </StrictMode>,
);
