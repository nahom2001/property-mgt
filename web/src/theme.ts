import type { ThemeConfig } from 'antd';

/**
 * Central theme — all tokens extracted from the Phison Real Estate reference.
 * Apply ONLY via ConfigProvider. No component-level style overrides anywhere else.
 */
export const theme: ThemeConfig = {
  token: {
    // ── Brand ──────────────────────────────────────────────────────────────
    colorPrimary: '#2D3B8E',        // deep indigo – nav active, buttons, logo
    colorPrimaryHover: '#3D4FA8',

    // ── Semantic ───────────────────────────────────────────────────────────
    colorSuccess: '#27AE60',
    colorWarning: '#E67E22',
    colorError: '#E74C3C',
    colorInfo: '#2980B9',

    // ── Background & surface ───────────────────────────────────────────────
    colorBgLayout: '#F5F6FA',       // cool off-white page background
    colorBgContainer: '#FFFFFF',    // card / table surface
    colorBgElevated: '#FFFFFF',

    // ── Borders ────────────────────────────────────────────────────────────
    colorBorder: '#E8EAF0',
    colorBorderSecondary: '#F0F1F5',

    // ── Text ───────────────────────────────────────────────────────────────
    colorText: '#1A1D2E',           // near-black with blue tint
    colorTextSecondary: '#6B7280',
    colorTextTertiary: '#9CA3AF',
    colorTextPlaceholder: '#9CA3AF',

    // ── Typography ─────────────────────────────────────────────────────────
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,

    // ── Shape ──────────────────────────────────────────────────────────────
    borderRadius: 8,
    borderRadiusSM: 4,
    borderRadiusLG: 12,

    // ── Spacing ────────────────────────────────────────────────────────────
    padding: 16,
    paddingSM: 8,
    paddingLG: 24,
    paddingXS: 4,
    margin: 16,
    marginSM: 8,
    marginLG: 24,

    // ── Shadow ─────────────────────────────────────────────────────────────
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.10)',

    // ── Control sizes ──────────────────────────────────────────────────────
    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
    lineWidth: 1,
  },

  components: {
    // ── Layout ─────────────────────────────────────────────────────────────
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 56,
      headerPadding: '0 24px',
      bodyBg: '#F5F6FA',
    },

    // ── Menu (top nav) ─────────────────────────────────────────────────────
    Menu: {
      horizontalItemSelectedColor: '#2D3B8E',
      horizontalItemSelectedBg: 'transparent',
      activeBarBorderWidth: 2,
      activeBarHeight: 2,
      itemColor: '#6B7280',
      itemHoverColor: '#2D3B8E',
      itemBg: 'transparent',
      itemActiveBg: 'transparent',
      itemSelectedBg: 'transparent',
      itemSelectedColor: '#2D3B8E',
      itemHeight: 56,
      iconSize: 16,
      fontSize: 14,
    },

    // ── Button ─────────────────────────────────────────────────────────────
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      paddingInline: 16,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultBorderColor: '#E8EAF0',
      defaultColor: '#1A1D2E',
    },

    // ── Input ──────────────────────────────────────────────────────────────
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      paddingInline: 12,
    },

    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },

    // ── Table ──────────────────────────────────────────────────────────────
    Table: {
      borderRadius: 8,
      headerBg: '#F5F6FA',
      headerColor: '#6B7280',
      headerSortActiveBg: '#F5F6FA',
      rowHoverBg: '#FAFBFF',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      fontSize: 14,
      borderColor: '#E8EAF0',
    },

    // ── Card ───────────────────────────────────────────────────────────────
    Card: {
      borderRadius: 8,
      paddingLG: 20,
      headerBg: 'transparent',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },

    // ── Tag ────────────────────────────────────────────────────────────────
    Tag: {
      borderRadius: 4,
      fontSize: 12,
    },

    // ── Tabs ───────────────────────────────────────────────────────────────
    Tabs: {
      inkBarColor: '#2D3B8E',
      itemActiveColor: '#2D3B8E',
      itemSelectedColor: '#2D3B8E',
      itemColor: '#6B7280',
      itemHoverColor: '#2D3B8E',
      cardBg: 'transparent',
      titleFontSize: 14,
      horizontalMargin: '0',
      horizontalItemPadding: '12px 0',
      horizontalItemGutter: 32,
    },

    // ── Statistic ──────────────────────────────────────────────────────────
    Statistic: {
      contentFontSize: 22,
      titleFontSize: 13,
    },

    // ── Form ───────────────────────────────────────────────────────────────
    Form: {
      labelColor: '#6B7280',
      labelFontSize: 13,
    },

    // ── Modal / Drawer ─────────────────────────────────────────────────────
    Modal: {
      borderRadius: 12,
    },

    Drawer: {
      borderRadius: 0,
    },
  },
};

/** Semantic color aliases re-used across components */
export const colors = {
  primary: '#2D3B8E',
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E8EAF0',
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7280',

  // Tag presets
  tagHouse: { bg: '#EFF0FF', text: '#2D3B8E' },
  tagMaterial: { bg: '#FFF3E0', text: '#E67E22' },
  tagIssued: { bg: '#EBF5FB', text: '#2980B9' },
  tagRegistered: { bg: '#E8F8F0', text: '#27AE60' },
  tagOverdue: { bg: '#FEF2F2', text: '#E74C3C' },
  tagPaid: { bg: '#E8F8F0', text: '#27AE60' },
  tagPartial: { bg: '#FFF8E1', text: '#E67E22' },
} as const;
