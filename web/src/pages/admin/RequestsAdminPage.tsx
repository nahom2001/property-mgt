import { useState } from 'react';
import {
  Table, Space, Typography, Select, Drawer, Button, Form, Input,
  App as AntApp, Descriptions, Divider, Tag,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { RequestStatus } from '@phison/types';
import type { ResidentRequest } from '@phison/types';
import { formatDateTime } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { REQUEST_TYPES, getRequestTypeLabel, getRequestStatusLabel } from '../../lib/requestTypes';

const { Title, Text } = Typography;

interface RequestWithHistory extends ResidentRequest {
  history: Array<{ id: string; toStatus: string; comment: string | null; timestamp: string }>;
  comments: Array<{ id: string; body: string; authorId: string; visibility: string; createdAt: string }>;
}

export default function RequestsAdminPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();

  const [typeFilter, setTypeFilter]     = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [unitFilter, setUnitFilter]     = useState<string | undefined>();
  const [selected, setSelected]         = useState<RequestWithHistory | null>(null);
  const [statusForm] = Form.useForm();
  const [responseForm] = Form.useForm();

  // ── Data ───────────────────────────────────────────────────────────────────

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests', typeFilter, statusFilter, unitFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter)   params.set('category', typeFilter);
      if (statusFilter) params.set('status',   statusFilter);
      if (unitFilter)   params.set('unitId',   unitFilter);
      const qs = params.toString();
      return api.get<RequestWithHistory[]>(`/requests${qs ? `?${qs}` : ''}`).then(r => r.data);
    },
  });

  // Unique unit IDs for unit filter select
  const unitOptions = [...new Set(requests.map(r => r.unitId))].map(id => ({
    label: id,
    value: id,
  }));

  // Full request for the open drawer
  const { data: selectedFull } = useQuery({
    queryKey: ['request-detail', selected?.id],
    queryFn: () =>
      api.get<RequestWithHistory>(`/requests/${selected!.id}`).then(r => r.data),
    enabled: !!selected?.id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: (v: { status: string; comment?: string }) =>
      api.patch(`/requests/${selected?.id}/status`, v),
    onSuccess: () => {
      message.success('Status updated');
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['request-detail', selected?.id] });
      statusForm.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const responseMutation = useMutation({
    mutationFn: (v: { body: string }) =>
      api.post(`/requests/${selected?.id}/comments`, { body: v.body, visibility: 'public' }),
    onSuccess: () => {
      message.success('Response sent to resident');
      qc.invalidateQueries({ queryKey: ['request-detail', selected?.id] });
      responseForm.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns = [
    {
      title: 'Title', dataIndex: 'subject', key: 'subject',
      render: (s: string, r: RequestWithHistory) => (
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500, textAlign: 'left', color: 'inherit' }}
          onClick={() => setSelected(r)}
        >
          {s}
        </button>
      ),
    },
    {
      title: 'Type', dataIndex: 'category', key: 'category',
      render: (c: string) => <Tag>{getRequestTypeLabel(c)}</Tag>,
    },
    { title: 'Unit', dataIndex: 'unitId', key: 'unitId' },
    { title: 'Resident', dataIndex: 'residentId', key: 'residentId' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
    { title: 'Submitted', dataIndex: 'createdAt', key: 'createdAt', render: formatDateTime },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, r: RequestWithHistory) => (
        <Button size="small" onClick={() => setSelected(r)}>Manage</Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Filters */}
      <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Title level={4} style={{ margin: 0 }}>Resident Requests</Title>
        <Space wrap>
          <Select
            allowClear
            placeholder="All types"
            style={{ width: 160 }}
            onChange={setTypeFilter}
            options={REQUEST_TYPES.map(t => ({ label: t.label, value: t.value }))}
          />
          <Select
            allowClear
            placeholder="All statuses"
            style={{ width: 180 }}
            onChange={setStatusFilter}
            options={Object.values(RequestStatus).map(s => ({
              label: getRequestStatusLabel(s),
              value: s,
            }))}
          />
          <Select
            allowClear
            placeholder="All units"
            style={{ width: 160 }}
            onChange={setUnitFilter}
            options={unitOptions}
          />
        </Space>
      </Space>

      <Table
        dataSource={requests}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 25, showSizeChanger: false }}
      />

      {/* ── Detail drawer ─────────────────────────────────────────── */}
      <Drawer
        title={selected?.subject ?? 'Request'}
        open={!!selected}
        onClose={() => { setSelected(null); statusForm.resetFields(); responseForm.resetFields(); }}
        width={520}
      >
        {selected && selectedFull && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Type">
                {getRequestTypeLabel(selectedFull.category)}
              </Descriptions.Item>
              <Descriptions.Item label="Unit">{selectedFull.unitId}</Descriptions.Item>
              <Descriptions.Item label="Resident">{selectedFull.residentId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedFull.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedFull.description}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Submitted">
                {formatDateTime(selectedFull.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            {/* History */}
            {selectedFull.history.length > 0 && (
              <>
                <Divider style={{ margin: '4px 0' }} />
                <Text strong>History</Text>
                {selectedFull.history.map(h => (
                  <div key={h.id} style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    <StatusTag status={h.toStatus} />
                    {' '}
                    {formatDateTime(h.timestamp)}
                    {h.comment && <div style={{ marginTop: 2 }}>{h.comment}</div>}
                  </div>
                ))}
              </>
            )}

            {/* Comments */}
            {selectedFull.comments.length > 0 && (
              <>
                <Divider style={{ margin: '4px 0' }} />
                <Text strong>Responses sent</Text>
                {selectedFull.comments.map(c => (
                  <div key={c.id} style={{ background: '#F9FAFB', padding: '8px 12px', borderRadius: 6, marginBottom: 4 }}>
                    <Text style={{ fontSize: 13 }}>{c.body}</Text>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      {c.visibility === 'internal' ? '[Internal] ' : ''}{formatDateTime(c.createdAt)}
                    </div>
                  </div>
                ))}
              </>
            )}

            <Divider style={{ margin: '4px 0' }} />

            {/* Update status */}
            <Form form={statusForm} layout="vertical" onFinish={v => statusMutation.mutate(v)}>
              <Text strong>Update Status</Text>
              <Form.Item name="status" rules={[{ required: true }]} style={{ marginTop: 8 }}>
                <Select
                  placeholder="New status…"
                  options={Object.values(RequestStatus).map(s => ({
                    label: getRequestStatusLabel(s),
                    value: s,
                  }))}
                />
              </Form.Item>
              <Form.Item name="comment">
                <Input placeholder="Internal note (optional)" />
              </Form.Item>
              <Button type="default" htmlType="submit" loading={statusMutation.isPending} block>
                Update Status
              </Button>
            </Form>

            <Divider style={{ margin: '4px 0' }} />

            {/* Send response to resident */}
            <Form form={responseForm} layout="vertical" onFinish={v => responseMutation.mutate(v)}>
              <Text strong>Send Response to Resident</Text>
              <Form.Item
                name="body"
                style={{ marginTop: 8 }}
                rules={[
                  { required: true, message: 'Enter a response' },
                  { min: 5, message: 'At least 5 characters' },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Type your response — the resident will see this…"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={responseMutation.isPending} block>
                Send Response
              </Button>
            </Form>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
