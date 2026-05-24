import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import i18n from '../i18n';
import { keycloak } from '../lib/keycloak';
import { useAuthStore } from '../store/auth.store';
import { notifyToast } from '../components/ui/Toast';

const BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request, refreshing it preemptively if it expires within 30s.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // Refresh failed - token chain is dead. Drop session and route to our
      // own login page (we don't redirect to the Keycloak hosted page anymore).
      await useAuthStore.getState().logout();
    }
    if (keycloak.token && config.headers) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && keycloak.authenticated) {
      originalRequest._retry = true;
      try {
        const refreshed = await keycloak.updateToken(-1);
        if (refreshed && keycloak.token) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return apiClient(originalRequest);
        }
      } catch {
        // fall through to logout
      }
      useAuthStore.getState().logout();
    }

    // Surface authorization failures globally so the user understands why the
    // page is empty (e.g. doctor not yet approved). Pages that already display
    // their own inline error UI also see the message - duplication is fine and
    // less confusing than silent failures.
    if (error.response?.status === 403) {
      const msg = i18n.t('patients.forbidden_title') + '. ' + i18n.t('patients.forbidden_hint');
      notifyToast(msg, 'error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
