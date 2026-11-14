import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  Layout, Menu, Avatar, Dropdown, Badge, Typography, Space, Button, theme as antTheme,
} from 'antd';
import {
  DashboardOutlined, TeamOutlined, HomeOutlined, DollarOutlined, FileTextOutlined,
  NotificationOutlined, CustomerServiceOutlined, SettingOutlined, LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme';

const { Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/residents', icon: <TeamOutlined />, label: 'Residents' },
  { key: '/admin/units', icon: <HomeOutlined />, label: 'Units' },
  { key: '/admin/payments', icon: <DollarOutlined />, label: 'Payments' },
  { key: '/admin/vouchers', icon: <FileTextOutlined />, label: 'Vouchers' },
  { key: '/admin/notices', icon: <NotificationOutlined />, label: 'Notices' },
  { key: '/admin/requests', icon: <CustomerServiceOutlined />, label: 'Requests' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { token } = antTheme.useToken();

  // Highlight the top-level nav item that matches the current path
  const selectedKey =
    NAV_ITEMS.find(item =>
      item.key === '/admin'
        ? location.pathname === '/admin'
        : location.pathname.startsWith(item.key)
    )?.key ?? location.pathname;

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign out',
        danger: true,
        onClick: () => { clearAuth(); navigate('/login'); },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {/* ── Top navigation bar ───────────────────────────────────────── */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 24px',
          height: 56,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>P</Text>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.primary }}>Phison</div>
            <div style={{ fontSize: 10, color: token.colorTextSecondary }}>Real Estate S.C.</div>
          </div>
        </div>

        {/* Nav items */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            justifyContent: 'center',
          }}
          overflowedIndicator={null}
        />

        {/* Right actions */}
        <Space size={8} style={{ minWidth: 140, justifyContent: 'flex-end' }}>
          <Badge count={0} size="small">
            <Button
              type="text"
              shape="circle"
              icon={<BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />}
            />
          </Badge>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer', gap: 8 }}>
              <Avatar
                size={32}
                style={{ backgroundColor: colors.primary, fontWeight: 600, fontSize: 14 }}
              >
                {user?.fullName
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) ?? 'AG'}
              </Avatar>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <Content
        style={{
          padding: 24,
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
}
