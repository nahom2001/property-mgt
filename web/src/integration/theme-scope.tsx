/**
 * ScopedThemeProvider
 *
 * Wraps Ant Design's ConfigProvider with:
 *   - Our custom design tokens (imported from theme.ts)
 *   - An optional CSS prefix (VITE_ANTD_PREFIX) to namespace all antd class
 *     names so they don't clash with the parent system's styles
 *
 * Usage:
 *   <ScopedThemeProvider>
 *     <App />
 *   </ScopedThemeProvider>
 *
 * The provider deliberately does NOT use React.StrictMode or any global CSS
 * reset so it can be safely embedded inside a parent application.
 */

import { ConfigProvider, App as AntApp } from 'antd';
import enUS from 'antd/locale/en_US';
import type { ReactNode } from 'react';
import { theme } from '../theme';
import { INTEGRATION_CONFIG } from './config';

interface Props {
  children: ReactNode;
  /** Override locale (e.g. for Amharic when available). Defaults to en-US. */
  locale?: React.ComponentProps<typeof ConfigProvider>['locale'];
}

export function ScopedThemeProvider({ children, locale = enUS }: Props) {
  return (
    <ConfigProvider
      theme={theme}
      locale={locale}
      prefixCls={INTEGRATION_CONFIG.antdPrefixCls}
    >
      {/* AntApp provides message/notification/modal context app-wide */}
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
