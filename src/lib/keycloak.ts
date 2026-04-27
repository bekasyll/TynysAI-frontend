import Keycloak from 'keycloak-js';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:7080';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'tynysai';
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'tynysai-frontend';

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const STORAGE_KEY = 'tynysai.kc.tokens';

export const keycloak = new Keycloak({
  url: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
});

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  /** Unix epoch seconds at which the access token expires. */
  expires_at: number;
}

function loadStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistTokens(t: StoredTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  // Keycloak tokens are base64url-encoded. atob handles standard base64 only,
  // so swap the URL-safe chars and pad before decoding.
  const segment = token.split('.')[1] ?? '';
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(segment.length / 4) * 4,
    '=',
  );
  return JSON.parse(decodeURIComponent(escape(atob(padded))));
}

/**
 * Hydrates the keycloak-js instance with raw access/refresh tokens - used by
 * our password-grant login flow which bypasses Keycloak's hosted login page.
 * Sets the same fields keycloak-js populates after a redirect login so that
 * the rest of the app (axios interceptor, auth store, updateToken) just
 * works without caring how we got here.
 */
function hydrateKeycloak(accessToken: string, refreshToken: string): void {
  const tokenParsed = decodeJwtPayload(accessToken);
  const refreshTokenParsed = decodeJwtPayload(refreshToken);
  // The keycloak-js typings don't expose these as writable, but the runtime
  // does - assigning them is the same path Keycloak takes after a redirect.
  const k = keycloak as unknown as Record<string, unknown>;
  k.token = accessToken;
  k.refreshToken = refreshToken;
  k.tokenParsed = tokenParsed;
  k.refreshTokenParsed = refreshTokenParsed;
  k.authenticated = true;
  k.subject = (tokenParsed as { sub?: string }).sub;
  if (typeof keycloak.onAuthSuccess === 'function') keycloak.onAuthSuccess();
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  error?: string;
  error_description?: string;
}

async function exchangeForTokens(form: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error_description || body?.error || `Login failed (${res.status})`;
    throw new Error(message);
  }
  return body as TokenResponse;
}

/**
 * Authenticates the user with email + password against Keycloak's token
 * endpoint (resource-owner password grant). On success, hydrates the
 * keycloak-js singleton and persists the refresh token so a page reload
 * stays logged in.
 *
 * Throws a humanly-readable error message on failure.
 */
export async function loginWithPassword(email: string, password: string): Promise<void> {
  const form = new URLSearchParams();
  form.set('grant_type', 'password');
  form.set('client_id', KEYCLOAK_CLIENT_ID);
  form.set('username', email);
  form.set('password', password);
  form.set('scope', 'openid');

  const tokens = await exchangeForTokens(form);
  hydrateKeycloak(tokens.access_token, tokens.refresh_token);
  persistTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
  });
}

/**
 * Restores the session from localStorage, refreshing the access token if it
 * has already expired. Returns true if the user is authenticated afterwards.
 */
async function tryRestoreSession(): Promise<boolean> {
  const stored = loadStoredTokens();
  if (!stored) return false;

  const stillValid = stored.expires_at - 30 > Math.floor(Date.now() / 1000);
  if (stillValid) {
    hydrateKeycloak(stored.access_token, stored.refresh_token);
    return true;
  }

  // Access token expired - try the refresh token.
  try {
    const form = new URLSearchParams();
    form.set('grant_type', 'refresh_token');
    form.set('client_id', KEYCLOAK_CLIENT_ID);
    form.set('refresh_token', stored.refresh_token);
    const tokens = await exchangeForTokens(form);
    hydrateKeycloak(tokens.access_token, tokens.refresh_token);
    persistTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
    });
    return true;
  } catch {
    clearStoredTokens();
    return false;
  }
}

/**
 * Initializes the Keycloak instance. We still call {@code keycloak.init} so
 * that downstream HTTP plumbing (endpoint URLs, refresh logic) is wired up
 * for {@code keycloak.updateToken()} calls, but with {@code onLoad: 'check-sso'}
 * removed - we manage the session ourselves through the password-grant flow.
 *
 * Resolves to {@code true} if a session was restored from storage.
 */
export async function initKeycloak(): Promise<boolean> {
  await keycloak.init({
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
  return tryRestoreSession();
}

/**
 * Logs out: revokes the refresh token on Keycloak (best-effort), wipes
 * local storage, and resets the keycloak-js instance. Falls back gracefully
 * if Keycloak is unreachable so the user always lands on the login page.
 */
export async function logoutLocal(): Promise<void> {
  const stored = loadStoredTokens();
  clearStoredTokens();
  if (stored?.refresh_token) {
    try {
      const form = new URLSearchParams();
      form.set('client_id', KEYCLOAK_CLIENT_ID);
      form.set('refresh_token', stored.refresh_token);
      await fetch(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
    } catch {
      /* ignore */
    }
  }
  const k = keycloak as unknown as Record<string, unknown>;
  k.token = undefined;
  k.refreshToken = undefined;
  k.tokenParsed = undefined;
  k.refreshTokenParsed = undefined;
  k.authenticated = false;
  k.subject = undefined;
  if (typeof keycloak.onAuthLogout === 'function') keycloak.onAuthLogout();
}

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface KeycloakUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export function currentUserFromToken(): KeycloakUser | null {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return null;
  const t = keycloak.tokenParsed as Record<string, unknown> & {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: { roles?: string[] };
  };

  const roles = t.realm_access?.roles ?? [];
  const role: Role = roles.includes('ADMIN')
    ? 'ADMIN'
    : roles.includes('DOCTOR')
      ? 'DOCTOR'
      : 'PATIENT';

  return {
    id: t.sub ?? '',
    email: t.email ?? '',
    fullName: [t.given_name, t.family_name].filter(Boolean).join(' ').trim() || (t.email ?? ''),
    role,
  };
}
