import { create } from 'zustand';
import type { Role } from '../types';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarBase64?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateAvatar: (avatarBase64: string | null) => void;
  clearAuth: () => void;
}

function loadFromStorage(): Partial<AuthState> {
  try {
    const user = localStorage.getItem('authUser');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (user && accessToken && refreshToken) {
      return {
        user: JSON.parse(user) as AuthUser,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      };
    }
  } catch {
    // ignore
  }
  return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...{ user: null, accessToken: null, refreshToken: null, isAuthenticated: false },
  ...loadFromStorage(),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  updateAvatar: (avatarBase64) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, avatarBase64: avatarBase64 ?? undefined };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return { user: updated };
    });
  },

  clearAuth: () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
