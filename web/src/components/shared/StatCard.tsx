import { Card, theme as antTheme } from 'antd';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  const { token } = antTheme.useToken();

  return (
    <Card
      styles={{ body: { padding: '16px 20px' } }}
      style={{
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: token.boxShadow,
      }}
    >
      <div style={{ fontSize: 12, color: token.colorTextSecondary, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, lineHeight: 1.2 }}>
        {value}
      </div>
    </Card>
  );
}
