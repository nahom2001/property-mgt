import { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select, Popconfirm, App as AntApp,
} from 'antd';
import { PlusOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { UserRole } from '@phison/types';
import type { User } from '@phison/types';
import { formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';

const { Title } = Typography;

export default function UsersPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post('/users', values),
    onSuccess: () => {
      message.success('User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/suspend`),
    onSuccess: () => { message.success('User suspended'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/reactivate`),
    onSuccess: () => { message.success('User reactivated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const columns = [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName', render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <StatusTag status={r === 'admin' ? 'resolved' : r === 'staff' ? 'acknowledged' : 'house'} /> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: formatDate },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          {record.status === 'active' ? (
            <Popconfirm title="Suspend this user?" onConfirm={() => suspendMutation.mutate(record.id)}>
              <Button size="small" danger icon={<StopOutlined />}>Suspend</Button>
            </Popconfirm>
          ) : (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivateMutation.mutate(record.id)}>
              Reactivate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Users</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add User</Button>
      </Space>

      <Table dataSource={users} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 20 }} />

      <Modal
        title="Add User"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={v => createMutation.mutate(v)}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={Object.values(UserRole).map(r => ({ label: r, value: r }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
