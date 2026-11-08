/**
 * ResidentDetailPage
 *
 * View page for a single resident:
 *   - Personal info card
 *   - Active & historical unit links
 *   - Charges summary (outstanding / overdue / paid)
 *   - Edit button (opens ResidentFormDrawer)
 */

import { useState } from 'react';
import {
  Card, Descriptions, Button, Space, Typography, Spin, Alert, Table, Tag,
  Row, Col,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { getErrorMessage } from '../../../lib/api';
import { formatDate, formatETB } from '../../../lib/formatters';
import { StatusTag } from '../../../components/shared/StatusTag';
import { StatCard } from '../../../components/shared/StatCard';
import { ResidentFormDrawer } from './ResidentFormDrawer';
import type { User, ResidentUnitLink, Charge } from '@phison/types';

const { Title, Text } = Typography;

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: resident, isLoading, error } = useQuery({
    queryKey: ['resident', id],
    queryFn: () => api.get<User>(`/residents/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: links = [] } = useQuery({
    queryKey: ['resident-links', id],
    queryFn: () =>
      api.get<ResidentUnitLink[]>(`/units/links/search?userId=${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: charges = [] } = useQuery({
    queryKey: ['resident-charges', id],
    queryFn: () =>
      api.get<Charge[]>(`/payments/charges?payerId=${id}`).then(r => r.data),
    enabled: !!id,
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeLinks = links.filter(l => !l.endDate);
  const activeCharges = charges.filter(c => c.status !== 'paid' && c.status !== 'cancelled');
  const overdueCharges = charges.filter(c => c.status === 'overdue');
  const totalOutstanding = activeCharges.reduce((s, c) => s + (c.amount - c.paidAmount), 0);

  // ── Charge table ──────────────────────────────────────────────────────────

  const chargeColumns = [
    { title: 'Type', dataIndex: 'allocationId', key: 'type' },
    { title: 'Amount (ETB)', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    {
      title: 'Outstanding (ETB)', key: 'outstanding',
      render: (_: unknown, r: Charge) => formatETB(r.amount - r.paidAmount),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: formatDate },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) return <Spin style={{ display: 'block', margin: '20vh auto' }} />;
  if (error || !resident) {
    return <Alert type="error" message={error ? getErrorMessage(error) : 'Resident not found'} showIcon />;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/residents')}>
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>{resident.fullName}</Title>
          <StatusTag status={resident.status} />
        </Space>
        <Button
          icon={<EditOutlined />}
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
      </Space>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard label="Outstanding (ETB)" value={formatETB(totalOutstanding)} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard label="Overdue Charges" value={overdueCharges.length} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard label="Active Unit Links" value={activeLinks.length} />
        </Col>
      </Row>

      {/* ── Personal info ──────────────────────────────────────────── */}
      <Card title="Personal Information">
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Full Name">
            <Text strong>{resident.fullName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email">{resident.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            {resident.phone ?? <Text type="secondary">—</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <StatusTag status={resident.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Language">
            {resident.preferredLanguage === 'am' ? 'Amharic' : 'English'}
          </Descriptions.Item>
          <Descriptions.Item label="Registered">
            {formatDate(resident.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ── Unit links ─────────────────────────────────────────────── */}
      <Card
        title="Unit Assignments"
        extra={
          activeLinks.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>No active links</Text>
          )
        }
      >
        {links.length === 0 ? (
          <Text type="secondary">This resident is not linked to any unit.</Text>
        ) : (
          <Table
            dataSource={links}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: 'Unit', dataIndex: 'unitId', key: 'unitId' },
              {
                title: 'Role', dataIndex: 'role', key: 'role',
                render: (r: string) => <Tag color={r === 'owner' ? 'purple' : 'blue'}>{r}</Tag>,
              },
              { title: 'Start', dataIndex: 'startDate', key: 'start', render: formatDate },
              {
                title: 'End', dataIndex: 'endDate', key: 'end',
                render: (d: string | null) =>
                  d ? formatDate(d) : <Tag color="green">Current</Tag>,
              },
            ]}
          />
        )}
      </Card>

      {/* ── Charges ────────────────────────────────────────────────── */}
      <Card title="Charges">
        <Table
          dataSource={charges}
          columns={chargeColumns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'No charges found' }}
          size="small"
        />
      </Card>

      {/* ── Edit drawer ────────────────────────────────────────────── */}
      <ResidentFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        resident={resident}
      />
    </Space>
  );
}
