import { useState } from 'react';
import {
  List, Card, Tag, Button, Space, Typography, Modal, Form, Input, Select, App as AntApp,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, getErrorMessage } from '../../lib/api';
import { REQUEST_TYPES } from '../../lib/requestTypes';
import type { ResidentRequest } from '@phison/types';
import { formatDateTime } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';

const { Title, Text } = Typography;

interface SubmitValues {
  type: string;
  title: string;
  description: string;
}

export default function ResidentRequests() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<SubmitValues>();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => api.get<ResidentRequest[]>('/requests/my').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (v: SubmitValues) =>
      api.post('/requests', {
        category: v.type,   // maps to existing category field on backend
        subject:  v.title,
        description: v.description,
      }),
    onSuccess: () => {
      message.success('Request submitted');
      qc.invalidateQueries({ queryKey: ['my-requests'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>My Requests</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          New Request
        </Button>
      </Space>

      <List
        loading={isLoading}
        dataSource={requests}
        locale={{ emptyText: 'No requests yet' }}
        renderItem={req => (
          <List.Item style={{ padding: 0, marginBottom: 8 }}>
            <Card
              style={{ width: '100%', cursor: 'pointer' }}
              onClick={() => navigate(`/resident/requests/${req.id}`)}
              styles={{ body: { padding: '14px 20px' } }}
            >
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Space direction="vertical" size={4}>
                  <Text strong style={{ fontSize: 14 }}>{req.subject}</Text>
                  <Space size={8}>
                    <Tag style={{ margin: 0 }}>{req.category}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateTime(req.createdAt)}
                    </Text>
                  </Space>
                </Space>
                <StatusTag status={req.status} />
              </Space>
              {/* Show latest admin response if any */}
              {(req as ResidentRequest & { latestResponse?: string }).latestResponse && (
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginTop: 8 }}
                >
                  Staff: {(req as ResidentRequest & { latestResponse?: string }).latestResponse}
                </Text>
              )}
            </Card>
          </List.Item>
        )}
      />

      {/* ── Submit request modal ────────────────────────────────────── */}
      <Modal
        title="Submit a Request"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Submit"
        confirmLoading={createMutation.isPending}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={v => createMutation.mutate(v)}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="type"
            label="Request Type"
            rules={[{ required: true, message: 'Select a request type' }]}
          >
            <Select
              placeholder="Select type…"
              options={REQUEST_TYPES.map(t => ({ label: t.label, value: t.value }))}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Title is required' },
              { min: 4, message: 'At least 4 characters' },
              { max: 120, message: 'Max 120 characters' },
            ]}
          >
            <Input placeholder="Brief summary of your request" maxLength={120} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Description is required' },
              { min: 10, message: 'At least 10 characters' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe the issue or request in detail…"
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
