import { create } from 'zustand';
import { keycloak, currentUserFromToken, logoutLocal } from '../lib/keycloak';
import apiClient from '../api/client';
import type { Role } from '../types';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  /**
   * blob:-URL pointing at the locally-fetched avatar binary. We can't use the
   * raw `/api/users/{id}/avatar` URL on an `<img>` tag because the browser
   * doesn't attach our Bearer token to image requests, so the gateway would
   * 401. Instead we fetch the bytes via axios (which does attach the token),
   * wrap them in a Blob URL and hand that to the component.
   */
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * Flips to true after `/api/users/me` upserts the User row in user-service.
   * Until then the panel must not mount, otherwise parallel requests like
   * /api/patients/me hit `userService.findById` and 404 on a brand-new user.
   */
  profileReady: boolean;
  refresh: () => void;
  /**
   * Overlays the display name/email from the DB profile (`/api/users/me`) onto
   * the store. The JWT only carries the name Keycloak issued at login, so after
   * the user edits their name we must source it from user-service instead of the
   * (now stale) token claims.
   */
  applyProfile: (profile: { fullName?: string | null; email?: string | null }) => void;
  /**
   * Idempotent: calls `/api/users/me` so user-service's `getOrProvision` runs.
   * Safe to invoke on every login / refresh - flips `profileReady` once.
   */
  ensureProfile: () => Promise<void>;
  /**
   * Pass the `avatarPath` returned by `/api/users/me` (or null/undefined when
   * the user has no avatar). The store fetches the binary, builds a fresh
   * blob:-URL and revokes the previous one - so an `<img src={user.avatarUrl}>`
   * just renders.
   */
  updateAvatar: (avatarPath: string | null | undefined) => Promise<void>;
  logout: () => Promise<void>;
}

/** Sidebar/header display name: "Имя Фамилия" only - no middle name. */
function displayName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].map((s) => s?.trim()).filter(Boolean).join(' ');
}

function snapshotUser(): AuthUser | null {
  const u = currentUserFromToken();
  if (!u) return null;
  const prev = useAuthStore.getState().user;
  const sameUser = prev?.id === u.id;
  return {
    id: u.id,
    email: sameUser ? prev!.email : u.email,
    // Display name/email come from the DB profile (applyProfile) once loaded.
    // Preserve them across token refreshes so a stale token - which still holds
    // the name issued at login - doesn't overwrite a freshly edited one. On the
    // first snapshot (new user) we fall back to the token claims.
    fullName: sameUser ? prev!.fullName : u.fullName,
    role: u.role as Role,
    avatarUrl: sameUser ? prev?.avatarUrl : undefined,
  };
}

function revokeIfBlob(url: string | undefined) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  profileReady: false,

  refresh: () => set({ user: snapshotUser(), isAuthenticated: !!keycloak.authenticated }),

  applyProfile: (profile) => set((state) => state.user
    ? {
        user: {
          ...state.user,
          fullName: profile.fullName?.trim() || state.user.fullName,
          email: profile.email?.trim() || state.user.email,
        },
      }
    : state),

  ensureProfile: async () => {
    if (!keycloak.authenticated) return;
    if (get().profileReady) return;
    try {
      const res = await apiClient.get('/users/me');
      const profile = res?.data?.data as
        { firstName?: string; lastName?: string; email?: string } | undefined;
      if (profile) get().applyProfile({
        fullName: displayName(profile.firstName, profile.lastName),
        email: profile.email,
      });
      set({ profileReady: true });
    } catch {
      // Leave profileReady=false: ProtectedRoute keeps the splash and the
      // next auth event (token refresh, navigation) will retry.
    }
  },

  updateAvatar: async (avatarPath) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const previousUrl = useAuthStore.getState().user?.avatarUrl;

    if (!avatarPath) {
      revokeIfBlob(previousUrl);
      set((state) => state.user
        ? { user: { ...state.user, avatarUrl: undefined } }
        : state);
      return;
    }

    try {
      const response = await apiClient.get(`/users/${userId}/avatar`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data as Blob);
      revokeIfBlob(previousUrl);
      set((state) => state.user
        ? { user: { ...state.user, avatarUrl: blobUrl } }
        : state);
    } catch {
      // 404 (deleted between getMe and avatar fetch) or 401 - fall back to letter.
      revokeIfBlob(previousUrl);
      set((state) => state.user
        ? { user: { ...state.user, avatarUrl: undefined } }
        : state);
    }
  },

  logout: async () => {
    revokeIfBlob(useAuthStore.getState().user?.avatarUrl);
    await logoutLocal();
    set({ user: null, isAuthenticated: false, profileReady: false });
    // Force a clean route - components depending on auth state will redirect.
    window.location.href = '/login';
  },
}));
