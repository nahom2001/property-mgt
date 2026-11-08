/**
 * SubNav — reusable horizontal secondary navigation bar.
 *
 * Renders an Ant Design Tabs component styled as a link bar.
 * Navigation is done via React Router (navigate on tab click).
 * The active tab is derived from the current URL, not local state.
 *
 * Usage:
 *   <SubNav items={PAYMENTS_NAV} />
 */

import { Tabs, theme as antTheme } from 'antd';
import { useNavigate, useLocation } from 'react-router';

export interface SubNavItem {
  key: string;   // full route path, e.g. '/admin/payments/provider'
  label: string;
}

interface SubNavProps {
  items: SubNavItem[];
}

export function SubNav({ items }: SubNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = antTheme.useToken();

  // Active key: exact match first, then prefix match for nested routes
  const activeKey =
    items.find(i => location.pathname === i.key)?.key ??
    items.find(i => location.pathname.startsWith(i.key))?.key ??
    items[0]?.key;

  return (
    <div
      style={{
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 20,
        marginTop: -4,
      }}
    >
      <Tabs
        activeKey={activeKey}
        onChange={key => navigate(key)}
        items={items.map(i => ({ key: i.key, label: i.label }))}
        style={{ marginBottom: 0 }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  );
}

// ── Pre-built sub-navs ────────────────────────────────────────────────────────

export const PAYMENTS_NAV: SubNavItem[] = [
  { key: '/admin/payments/provider', label: 'Provider Payments' },
  { key: '/admin/payments/meter-readings', label: 'Meter Readings' },
  { key: '/admin/payments/charges', label: 'Charges' },
  { key: '/admin/payments/pending', label: 'Pending Confirmations' },
  { key: '/admin/payments/ledger', label: 'Recovery Ledger' },
];

export function PaymentsSubNav() {
  return <SubNav items={PAYMENTS_NAV} />;
}
