/**
 * CRM integration stub.
 *
 * Fetches the house/unit inventory from the parent CRM module and filters to
 * units whose status is "sold". If the CRM is unavailable the last successfully
 * fetched data is returned from sessionStorage (stale-while-revalidate pattern).
 *
 * Open questions:
 *   1. What is the exact CRM API URL and auth header?
 *   2. What does the CRM unit object look like (field names)?
 *   3. Is the CRM on the same origin (proxy) or a different host?
 *
 * Until those are answered VITE_CRM_BASE_URL defaults to empty string, which
 * makes the stub fall straight through to the local units fallback.
 */

import { INTEGRATION_CONFIG as _INTEGRATION_CONFIG } from '../integration/config';
import { api } from './api';
import { UnitStatus } from '@phison/types';
import type { Unit } from '@phison/types';

const CACHE_KEY = 'phison_crm_units_cache';

export interface CrmUnit {
  id: string;
  identifier: string;
  status: string;      // "sold" | "available" | etc — CRM vocabulary
  type: string;
  area?: number;
  floor?: string;
  blockId?: string;
}

/** Shape the raw CRM unit into our internal Unit model */
function mapCrmUnit(raw: CrmUnit): Unit {
  return {
    id: raw.id,
    identifier: raw.identifier,
    type: (raw.type as Unit['type']) ?? 'apartment',
    area: raw.area ?? null,
    floor: raw.floor ?? null,
    notes: null,
    status: 'active' as UnitStatus,   // sold = active in our domain
    blockId: raw.blockId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * fetchSoldUnits
 *
 * Returns units from the CRM whose status is "sold".
 * Falls back to our own /units endpoint if the CRM is unavailable.
 */
export async function fetchSoldUnits(): Promise<{
  units: Unit[];
  source: 'crm' | 'local' | 'cache';
  crmAvailable: boolean;
  error: string | null;
}> {
  const crmBase = (import.meta.env.VITE_CRM_BASE_URL as string | undefined) ?? '';

  if (crmBase) {
    try {
      // Use a plain fetch so we can set a short timeout without affecting the
      // main axios instance.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const resp = await fetch(`${crmBase}/units?status=sold`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`CRM responded ${resp.status}`);

      const raw: CrmUnit[] = await resp.json() as CrmUnit[];
      const units = raw.filter(u => u.status === 'sold').map(mapCrmUnit);

      // Persist to cache
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(units));

      return { units, source: 'crm', crmAvailable: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'CRM unavailable';

      // Try stale cache
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        return {
          units: JSON.parse(cached) as Unit[],
          source: 'cache',
          crmAvailable: false,
          error: `CRM unavailable — showing last fetched data. (${message})`,
        };
      }

      // Fall through to local units
    }
  }

  // CRM not configured or unavailable and no cache — use local units
  const localResp = await api.get<Unit[]>('/units');
  return {
    units: localResp.data.filter(u => u.status === 'active'),
    source: 'local',
    crmAvailable: false,
    error: crmBase
      ? 'CRM unavailable and no cached data — showing local units.'
      : null,  // CRM simply not configured yet, no error
  };
}
