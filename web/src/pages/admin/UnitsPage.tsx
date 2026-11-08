import { useState } from 'react';
import {
  Table, Button, Tag, Space, Typography, Modal, Form, Input, Select, InputNumber, App as AntApp,
} from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { UnitType, ResidentRole } from '@phison/types';
import type { Unit, User } from '@phison/types';
import DatePicker from 'antd/es/date-picker/index';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function UnitsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [unitModal, setUnitModal] = useState(false);
  const [linkModal, setLinkModal] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [linkForm] = Form.useForm();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get<Unit[]>('/units').then(r => r.data),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then(r => r.data),
    select: users => users.filter(u => u.role === 'resident'),
  });

  const createMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/units', v),
    onSuccess: () => { message.success('Unit created'); qc.invalidateQueries({ queryKey: ['units'] }); setUnitModal(false); form.resetFields(); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const linkMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/units/links', { ...v, unitId: linkModal }),
    onSuccess: () => { message.success('Resident linked'); setLinkModal(null); linkForm.resetFields(); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const columns = [
    { title: 'Identifier', dataIndex: 'identifier', key: 'identifier' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Area (m²)', dataIndex: 'area', key: 'area', render: (a: number | null) => a ?? '—' },
    { title: 'Floor', dataIndex: 'floor', key: 'floor', render: (f: string | null) => f ?? '—' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Unit) => (
        <Button size="small" icon={<LinkOutlined />} onClick={() => setLinkModal(record.id)}>
          Link Resident
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Units</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setUnitModal(true)}>
          Add Unit
        </Button>
      </Space>

      <Table dataSource={units} columns={columns} rowKey="id" loading={isLoading} />

      {/* Create unit modal */}
      <Modal title="Add Unit" open={unitModal} onCancel={() => { setUnitModal(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={v => createMutation.mutate(v)}>
          <Form.Item name="identifier" label="Identifier" rules={[{ required: true }]}><Input placeholder="e.g. Apt 4B" /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={Object.values(UnitType).map(t => ({ label: t, value: t }))} />
          </Form.Item>
          <Form.Item name="area" label="Area (m²)"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="floor" label="Floor"><Input /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>

      {/* Link resident modal */}
      <Modal title="Link Resident to Unit" open={!!linkModal} onCancel={() => { setLinkModal(null); linkForm.resetFields(); }} onOk={() => linkForm.submit()} confirmLoading={linkMutation.isPending}>
        <Form form={linkForm} layout="vertical" onFinish={v => linkMutation.mutate({ ...v, startDate: v.startDate ? dayjs(v.startDate).toISOString() : '' })}>
          <Form.Item name="userId" label="Resident" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={residents.map(r => ({ label: `${r.fullName} (${r.email})`, value: r.id }))} />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={Object.values(ResidentRole).map(r => ({ label: r, value: r }))} />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
