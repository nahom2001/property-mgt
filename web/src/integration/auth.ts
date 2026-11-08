/**
 * Integration auth layer.
 *
 * Thin wrapper around useAuthStore that exposes a stable surface for the
 * parent system to swap in its own auth mechanism later without touching
 * every page component.
 */

import { useAuthStore } from '../store/auth';
import { INTEGRATION_CONFIG } from './config';
import type { UserRole } from '@phison/types';

export interface IntegrationAuth {
  /** Our internal user id (from the Phison API). */
  userId: string | null;
  /** The parent system's user id, if injected via env. */
  parentUserId: string | null;
  role: UserRole | null;
  /** Raw JWT access token — pass to Authorization header. */
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isResident: boolean;
}

/**
 * useIntegrationAuth — call inside any React component.
 * Returns a stable, typed auth context that abstracts the underlying store.
 */
export function useIntegrationAuth(): IntegrationAuth {
  const store = useAuthStore();
  return {
    userId: store.user?.id ?? null,
    parentUserId: INTEGRATION_CONFIG.parentUserId,
    role: store.user?.role ?? null,
    token: store.accessToken,
    isAuthenticated: store.user !== null,
    isAdmin: store.isAdmin(),
    isStaff: store.isStaff(),
    isResident: store.isResident(),
  };
}

/**
 * getAccessToken — for use outside React (e.g. axios interceptors).
 * Reads directly from localStorage, matching the store's persist strategy.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}
