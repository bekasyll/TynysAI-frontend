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

function snapshotUser(): AuthUser | null {
  const u = currentUserFromToken();
  if (!u) return null;
  const prev = useAuthStore.getState().user;
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role as Role,
    avatarUrl: prev?.id === u.id ? prev?.avatarUrl : undefined,
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

  ensureProfile: async () => {
    if (!keycloak.authenticated) return;
    if (get().profileReady) return;
    try {
      await apiClient.get('/users/me');
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
