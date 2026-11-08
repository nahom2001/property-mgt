import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  Layout, Menu, Avatar, Dropdown, Badge, Typography, Space, Button, theme as antTheme,
} from 'antd';
import {
  DashboardOutlined, DollarOutlined, FileTextOutlined,
  NotificationOutlined, CustomerServiceOutlined, LogoutOutlined, BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme';

const { Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/resident', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/resident/charges', label: 'My Charges', icon: <DollarOutlined /> },
  { key: '/resident/vouchers', label: 'Vouchers', icon: <FileTextOutlined /> },
  { key: '/resident/notices', label: 'Notices', icon: <NotificationOutlined /> },
  { key: '/resident/requests', label: 'Requests', icon: <CustomerServiceOutlined /> },
];

export function ResidentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { token } = antTheme.useToken();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
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
            <div style={{ fontSize: 10, color: token.colorTextSecondary }}>Resident Portal</div>
          </div>
        </div>

        {/* Nav */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none', background: 'transparent', justifyContent: 'center' }}
        />

        {/* Right */}
        <Space size={8} style={{ minWidth: 120, justifyContent: 'flex-end' }}>
          <Badge count={0} size="small">
            <Button
              type="text"
              shape="circle"
              icon={<BellOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />}
            />
          </Badge>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Avatar
              size={32}
              style={{ backgroundColor: colors.primary, fontWeight: 600, cursor: 'pointer' }}
            >
              {user?.fullName?.[0]?.toUpperCase() ?? 'R'}
            </Avatar>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: 24, minHeight: 'calc(100vh - 56px)' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
