/**
 * ResidentsPage
 *
 * Shows all users in the system grouped by role (Residents / Staff / Admins).
 * Staff and admin accounts are still manageable here — the page is "Residents"
 * first but is the full user directory. A role filter tab bar separates the views.
 *
 * "Register Resident" creates a user with role=resident and links them to a unit.
 * "Add Staff / Admin" creates a user with role=staff or role=admin (no unit link).
 */

import { useState } from 'react';
import {
  Table, Button, Space, Typography, Tabs, Input, Popconfirm, Modal, Form, Select,
  App as AntApp, Row, Col,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, EditOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { UserRole, UserStatus } from '@phison/types';
import type { User } from '@phison/types';
import { formatDate } from '../../../lib/formatters';
import { api, getErrorMessage } from '../../../lib/api';
import { StatusTag } from '../../../components/shared/StatusTag';
import { StatCard } from '../../../components/shared/StatCard';
import { ResidentFormDrawer } from './ResidentFormDrawer';
import { ResidentImportDrawer } from './ResidentImportDrawer';

const { Title } = Typography;

// ── Staff / Admin creation form (minimal — no unit link) ─────────────────────

interface StaffFormValues {
  fullName: string;
  email: string;
  password: string;
  role: UserRole.Admin | UserRole.Staff;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResidentsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [residentDrawerOpen, setResidentDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | undefined>();
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState<'resident' | 'staff' | 'admin'>('resident');
  const [staffForm] = Form.useForm<StaffFormValues>();

  // ── Data ───────────────────────────────────────────────────────────────────

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['residents'],
    queryFn: () => api.get<User[]>('/residents').then(r => r.data),
  });

  // ── Derived lists ──────────────────────────────────────────────────────────

  const filtered = users
    .filter(u => u.role === roleTab)
    .filter(u =>
      search === '' ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
    );

  const residentCount = users.filter(u => u.role === UserRole.Resident).length;
  const activeCount = users.filter(u => u.role === UserRole.Resident && u.status === UserStatus.Active).length;
  const staffCount = users.filter(u => u.role === UserRole.Staff).length;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/suspend`),
    onSuccess: () => { message.success('Account suspended'); qc.invalidateQueries({ queryKey: ['residents'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/reactivate`),
    onSuccess: () => { message.success('Account reactivated'); qc.invalidateQueries({ queryKey: ['residents'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const createStaffMutation = useMutation({
    mutationFn: (v: StaffFormValues) => api.post('/users', { ...v }),
    onSuccess: () => {
      message.success('Account created');
      qc.invalidateQueries({ queryKey: ['residents'] });
      setStaffModalOpen(false);
      staffForm.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Table columns ──────────────────────────────────────────────────────────

  const residentColumns = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, record: User) => (
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontWeight: 500, color: 'inherit', textAlign: 'left',
          }}
          onClick={() => navigate(`/admin/residents/${record.id}`)}
        >
          {name}
        </button>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (p: string | null) => p ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
    { title: 'Registered', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: User) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/residents/${record.id}`)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditTarget(record); setResidentDrawerOpen(true); }}
          />
          {record.status === UserStatus.Active ? (
            <Popconfirm
              title="Suspend this account?"
              description="The resident will lose access immediately."
              onConfirm={() => suspendMutation.mutate(record.id)}
              okText="Suspend"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => reactivateMutation.mutate(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const staffAdminColumns = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName', render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <StatusTag status={r === 'admin' ? 'resolved' : 'acknowledged'} /> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: User) => (
        <Space size={4}>
          {record.status === UserStatus.Active ? (
            <Popconfirm title="Suspend this account?" onConfirm={() => suspendMutation.mutate(record.id)} okButtonProps={{ danger: true }} okText="Suspend">
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          ) : (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivateMutation.mutate(record.id)} />
          )}
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Header */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Residents</Title>
        <Space>
          <Button onClick={() => setStaffModalOpen(true)}>Add Staff / Admin</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditTarget(undefined); setResidentDrawerOpen(true); }}
          >
            Register Resident
          </Button>
        </Space>
      </Space>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><StatCard label="Total Residents" value={residentCount} /></Col>
        <Col xs={24} sm={8}><StatCard label="Active Residents" value={activeCount} /></Col>
        <Col xs={24} sm={8}><StatCard label="Staff Members" value={staffCount} /></Col>
      </Row>

      {/* Role tabs + search */}
      <div>
        <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
          <Tabs
            activeKey={roleTab}
            onChange={k => { setRoleTab(k as typeof roleTab); setSearch(''); }}
            style={{ marginBottom: 0 }}
            tabBarStyle={{ marginBottom: 0 }}
            items={[
              { key: 'resident', label: `Residents (${users.filter(u => u.role === 'resident').length})` },
              { key: 'staff', label: `Staff (${users.filter(u => u.role === 'staff').length})` },
              { key: 'admin', label: `Admins (${users.filter(u => u.role === 'admin').length})` },
            ]}
          />
          <Input
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
        </Space>

        <Table
          dataSource={filtered}
          columns={roleTab === 'resident' ? residentColumns : staffAdminColumns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </div>

      {/* Register / Edit resident drawer */}
      <ResidentFormDrawer
        open={residentDrawerOpen}
        onClose={() => { setResidentDrawerOpen(false); setEditTarget(undefined); }}
        resident={editTarget}
      />

      {/* Bulk import drawer */}
      <ResidentImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      {/* Add Staff / Admin modal */}
      <Modal
        title="Add Staff or Admin"
        open={staffModalOpen}
        onCancel={() => { setStaffModalOpen(false); staffForm.resetFields(); }}
        onOk={() => staffForm.submit()}
        confirmLoading={createStaffMutation.isPending}
        width={440}
      >
        <Form
          form={staffForm}
          layout="vertical"
          onFinish={v => createStaffMutation.mutate(v)}
        >
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Staff', value: UserRole.Staff },
              { label: 'Admin', value: UserRole.Admin },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
