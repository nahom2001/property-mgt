import { Row, Col, Typography, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatETB } from '../../lib/formatters';
import { StatCard } from '../../components/shared/StatCard';

const { Title } = Typography;

export default function DashboardPage() {
  const { data: ledger } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => api.get<Array<{ outstanding: number }>>('/payments/ledger').then(r => r.data),
  });

  const { data: charges } = useQuery({
    queryKey: ['charges-overdue'],
    queryFn: () => api.get<unknown[]>('/payments/charges?status=overdue').then(r => r.data),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => api.get<unknown[]>('/payments/resident/pending').then(r => r.data),
  });

  const { data: requests } = useQuery({
    queryKey: ['requests-open'],
    queryFn: () => api.get<unknown[]>('/requests?status=submitted').then(r => r.data),
  });

  const totalOutstanding = ledger?.reduce((s, l) => s + l.outstanding, 0) ?? 0;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Total Outstanding (ETB)" value={formatETB(totalOutstanding)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Overdue Charges" value={charges?.length ?? 0} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Pending Confirmations" value={pendingPayments?.length ?? 0} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard label="Open Requests" value={requests?.length ?? 0} />
        </Col>
      </Row>
    </Space>
  );
}
