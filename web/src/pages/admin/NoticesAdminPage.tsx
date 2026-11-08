import { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select, App as AntApp,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { NoticeCategory, NoticeAudienceType } from '@phison/types';
import type { Notice } from '@phison/types';
import { formatDateTime } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';

const { Title } = Typography;

const CATEGORY_LABELS: Record<string, string> = {
  payment: 'Payment', maintenance: 'Maintenance', outage: 'Outage', general: 'General',
};

export default function NoticesAdminPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/notices').then(r => r.data),
  });

  const publishMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/notices', v),
    onSuccess: () => {
      message.success('Notice published');
      qc.invalidateQueries({ queryKey: ['notices'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const retractMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notices/${id}/retract`),
    onSuccess: () => { message.success('Notice retracted'); qc.invalidateQueries({ queryKey: ['notices'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string) => <span style={{ fontWeight: 500 }}>{t}</span> },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: (c: string) => <StatusTag status={c === 'payment' ? 'acknowledged' : c === 'maintenance' ? 'house' : c === 'outage' ? 'submitted' : 'issued'} />,
    },
    { title: 'Audience', dataIndex: 'audienceType', key: 'audience', render: (a: string) => a.replace(/_/g, ' ') },
    { title: 'Published', dataIndex: 'publishedAt', key: 'published', render: formatDateTime },
    {
      title: 'Type', dataIndex: 'isSystemGenerated', key: 'type',
      render: (v: boolean) => v ? <StatusTag status="acknowledged" /> : <StatusTag status="issued" />,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s === 'active' ? 'issued' : 'retracted'} />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Notice) =>
        record.status === 'active' ? (
          <Button size="small" danger onClick={() => retractMutation.mutate(record.id)}>Retract</Button>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Notices</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Publish Notice
        </Button>
      </Space>

      <Table dataSource={notices} columns={columns} rowKey="id" loading={isLoading} />

      <Modal
        title="Publish Notice"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={publishMutation.isPending}
        width={540}
      >
        <Form form={form} layout="vertical" onFinish={v => publishMutation.mutate(v)}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={Object.values(NoticeCategory).map(c => ({ label: CATEGORY_LABELS[c] ?? c, value: c }))} />
          </Form.Item>
          <Form.Item name="audienceType" label="Audience" rules={[{ required: true }]}>
            <Select options={Object.values(NoticeAudienceType).map(a => ({ label: a.replace(/_/g, ' '), value: a }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
