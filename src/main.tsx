import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './i18n';
import './index.css';
import { initKeycloak, keycloak } from './lib/keycloak';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function renderApp() {
  useAuthStore.getState().refresh();
  // Provision the User row on the first paint when we already have a session
  // (e.g. SSO check on a fresh tab) - otherwise the panel mounts and fires
  // /api/patients/me before user-service has the User in the DB.
  void useAuthStore.getState().ensureProfile();

  keycloak.onAuthSuccess = async () => {
    useAuthStore.getState().refresh();
    await useAuthStore.getState().ensureProfile();
  };
  keycloak.onAuthRefreshSuccess = () => useAuthStore.getState().refresh();
  keycloak.onAuthLogout = () => useAuthStore.getState().refresh();
  keycloak.onTokenExpired = () => keycloak.updateToken(30).catch(() => keycloak.logout());

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

initKeycloak()
  .then(() => renderApp())
  .catch((err) => {
    // Keycloak init can fail mid-flow (e.g. token-exchange after login redirect)
    // even when the realm itself is reachable. Surface the real error and still
    // boot the app so the user lands on the login screen rather than a blank page.
    console.error('Keycloak init failed', err);
    const detail = err instanceof Error
      ? `${err.name}: ${err.message}`
      : (typeof err === 'string' ? err : JSON.stringify(err));
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9999;padding:.75rem 1rem;' +
      'background:#fee2e2;color:#7f1d1d;font:12px/1.4 ui-monospace,monospace;' +
      'border-bottom:1px solid #fecaca';
    banner.textContent = `Keycloak init failed - ${detail}. Проверь Realm "tynysai", клиент "tynysai-frontend" (Valid redirect URIs / Web origins) и сетевые запросы в DevTools.`;
    document.body.appendChild(banner);
    renderApp();
  });
