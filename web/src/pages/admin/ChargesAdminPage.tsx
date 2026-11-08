import { Table, Space, Typography, Select, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { StatCard } from '../../components/shared/StatCard';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import { ChargeStatus } from '@phison/types';
import type { Charge } from '@phison/types';

const { Title } = Typography;

export default function ChargesAdminPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['charges', statusFilter],
    queryFn: () =>
      api.get<Charge[]>(`/payments/charges${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  });

  const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
  const totalCollected = charges.reduce((s, c) => s + c.paidAmount, 0);
  const totalOutstanding = totalCharged - totalCollected;

  const columns = [
    {
      title: 'Unit', dataIndex: 'unitId', key: 'unitId',
      render: (id: string) => <span style={{ fontWeight: 500 }}>{id}</span>,
    },
    { title: 'Payer', dataIndex: 'payerId', key: 'payerId' },
    {
      title: 'Role', dataIndex: 'payerRole', key: 'payerRole',
      render: (r: string) => <StatusTag status={r} />,
    },
    { title: 'Amount (ETB)', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    {
      title: 'Paid (ETB)', dataIndex: 'paidAmount', key: 'paidAmount',
      render: (a: number) => formatETB(a),
    },
    {
      title: 'Outstanding (ETB)', key: 'outstanding',
      render: (_: unknown, r: Charge) => formatETB(r.amount - r.paidAmount),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: formatDate },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Charges</Title>
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 180 }}
          onChange={setStatusFilter}
          options={Object.values(ChargeStatus).map(s => ({ label: s.replace(/_/g, ' '), value: s }))}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><StatCard label="Total Charged (ETB)" value={formatETB(totalCharged)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Total Collected (ETB)" value={formatETB(totalCollected)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Outstanding (ETB)" value={formatETB(totalOutstanding)} /></Col>
      </Row>

      <Table dataSource={charges} columns={columns} rowKey="id" loading={isLoading} />
    </Space>
  );
}
