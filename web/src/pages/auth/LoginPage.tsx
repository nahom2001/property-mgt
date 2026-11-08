import { Card, Form, Input, Button, Typography, Alert, theme as antTheme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, getErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme';
import type { LoginRequest, LoginResponse } from '@phison/types';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { token } = antTheme.useToken();

  const loginMutation = useMutation({
    mutationFn: (dto: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', dto).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate(data.user.role === 'resident' ? '/resident' : '/admin', { replace: true });
    },
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorBgLayout,
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{ body: { padding: 40 } }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>P</Text>
          </div>
          <Title level={4} style={{ margin: 0, color: colors.primary }}>Phison Property</Title>
          <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>Sign in to your account</Text>
        </div>

        {loginMutation.isError && (
          <Alert
            type="error"
            message={getErrorMessage(loginMutation.error)}
            style={{ marginBottom: 20, borderRadius: 8 }}
            showIcon
          />
        )}

        <Form
          layout="vertical"
          onFinish={values => loginMutation.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label={<span style={{ color: token.colorTextSecondary, fontSize: 13 }}>Email</span>}
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="your@email.com"
              autoComplete="email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: token.colorTextSecondary, fontSize: 13 }}>Password</span>}
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="Password"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loginMutation.isPending}
            style={{ marginTop: 8, fontWeight: 600 }}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
