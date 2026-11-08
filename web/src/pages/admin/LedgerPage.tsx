import { Table, Typography, Space, Row, Col, Progress, theme as antTheme } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { StatCard } from '../../components/shared/StatCard';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import { colors } from '../../theme';

const { Title } = Typography;

interface LedgerRow {
  id: string;
  type: string;
  provider: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  amount: number;
  recovered: number;
  outstanding: number;
  status: string;
  currency: string;
}

export default function LedgerPage() {
  const { token } = antTheme.useToken();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => api.get<LedgerRow[]>('/payments/ledger').then(r => r.data),
  });

  const totalPaid = rows.reduce((s, r) => s + r.amount, 0);
  const totalRecovered = rows.reduce((s, r) => s + r.recovered, 0);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  const columns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <StatusTag status={t === 'service_fee' ? 'material' : 'house'} /> },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    {
      title: 'Billing Period', key: 'period',
      render: (_: unknown, r: LedgerRow) => `${formatDate(r.billingPeriodStart)} – ${formatDate(r.billingPeriodEnd)}`,
    },
    { title: 'Paid Out (ETB)', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Recovered (ETB)', dataIndex: 'recovered', key: 'recovered', render: (a: number) => formatETB(a) },
    {
      title: 'Outstanding (ETB)', dataIndex: 'outstanding', key: 'outstanding',
      render: (a: number) => (
        <span style={{ color: a > 0 ? token.colorError : token.colorSuccess, fontWeight: 600 }}>
          {formatETB(a)}
        </span>
      ),
    },
    {
      title: 'Recovery', key: 'pct',
      render: (_: unknown, r: LedgerRow) => {
        const pct = r.amount > 0 ? Math.round((r.recovered / r.amount) * 100) : 0;
        return (
          <Progress
            percent={pct}
            size="small"
            strokeColor={pct >= 100 ? colors.tagPaid.text : pct > 50 ? colors.primary : token.colorError}
            showInfo={false}
            style={{ width: 100 }}
          />
        );
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Title level={4} style={{ margin: 0 }}>Recovery Ledger</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><StatCard label="Total Paid Out (ETB)" value={formatETB(totalPaid)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Total Recovered (ETB)" value={formatETB(totalRecovered)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Outstanding (ETB)" value={formatETB(totalOutstanding)} /></Col>
      </Row>

      <Table dataSource={rows} columns={columns} rowKey="id" loading={isLoading} />
    </Space>
  );
}
