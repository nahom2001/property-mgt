/**
 * Integration configuration.
 *
 * This is the single place that knows about the parent system's environment.
 * All other modules read from here — never from import.meta.env directly.
 *
 * Open questions (see plan):
 *   1. How does the parent inject auth (localStorage JWT assumed for now)?
 *   2. What base route prefix does the parent mount this app on?
 *   3. Does the parent provide its own navigation shell?
 *   4. Does the parent already have Ant Design (affects prefixCls choice)?
 *   5. Where are file attachments stored?
 */

export const INTEGRATION_CONFIG = {
  /**
   * REST API base URL.
   * Override via VITE_API_BASE_URL env var; defaults to relative /api/v1 so
   * the Vite proxy handles it in dev and the parent's reverse proxy in prod.
   */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1',

  /**
   * Base route path this app is mounted on inside the parent system.
   * Example: if the parent mounts at /property-management, set
   *   VITE_BASE_ROUTE=/property-management
   * Leave empty or "/" for standalone deployment.
   */
  baseRoute: (import.meta.env.VITE_BASE_ROUTE as string | undefined) ?? '/',

  /**
   * When the parent system has its own user record, it can inject the
   * parent-side user ID here. We store a reference to it rather than
   * duplicating identity data.
   */
  parentUserId: (import.meta.env.VITE_PARENT_USER_ID as string | undefined) ?? null,

  /**
   * Set to "true" when running against the in-browser mock instead of a real
   * API. Controlled by VITE_USE_MOCK.
   */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',

  /**
   * CSS class prefix for Ant Design components.
   * Set to a unique value if the parent app also uses Ant Design to prevent
   * style collisions. Default 'ant' is fine when the parent does not use antd.
   */
  antdPrefixCls: (import.meta.env.VITE_ANTD_PREFIX as string | undefined) ?? 'ant',
} as const;
