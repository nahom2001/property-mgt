import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@phison/types';

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isResident: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('access_token', accessToken);
        set({ user, accessToken });
      },
      clearAuth: () => {
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null });
      },
      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => get().user?.role === 'staff',
      isResident: () => get().user?.role === 'resident',
    }),
    {
      name: 'phison-auth',
      partialize: state => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);
