import { useParams, useNavigate } from 'react-router';
import {
  Card, Space, Typography, Timeline, Button, Form, Input, App as AntApp, Divider, Spin, Alert,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { RequestStatus, CommentVisibility } from '@phison/types';
import { formatDateTime } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { getRequestTypeLabel, getRequestStatusLabel } from '../../lib/requestTypes';

// Add a registration form so that the residents can register their issues
const { Title, Text, Paragraph } = Typography;

interface HistoryEntry {
  id: string;
  toStatus: string;
  comment: string | null;
  timestamp: string;
}

interface Comment {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
}

interface RequestDetail {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  history: HistoryEntry[];
  comments: Comment[];
}

export default function ResidentRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => api.get<RequestDetail>(`/requests/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (v: { body: string }) =>
      api.post(`/requests/${id}/comments`, { ...v, visibility: CommentVisibility.Public }),
    onSuccess: () => {
      message.success('Comment added');
      qc.invalidateQueries({ queryKey: ['request', id] });
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  if (isLoading) return <Spin style={{ display: 'block', margin: '20vh auto' }} />;
  if (error || !request) return <Alert type="error" message="Request not found" showIcon />;

  const canComment =
    request.status !== RequestStatus.Closed &&
    request.status !== RequestStatus.Rejected;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Header */}
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
        <Title level={4} style={{ margin: 0 }}>{request.subject}</Title>
        <StatusTag status={request.status} />
      </Space>

      {/* Details */}
      <Card>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space>
            <Text type="secondary">Type:</Text>
            <Text>{getRequestTypeLabel(request.category)}</Text>
            <Text type="secondary" style={{ marginLeft: 16 }}>Status:</Text>
            <Text>{getRequestStatusLabel(request.status)}</Text>
          </Space>
          <Divider style={{ margin: '8px 0' }} />
          <Paragraph style={{ margin: 0 }}>{request.description}</Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Submitted {formatDateTime(request.createdAt)}
          </Text>
        </Space>
      </Card>

      {/* History */}
      <Card title="History">
        <Timeline
          items={request.history.map(h => ({
            children: (
              <Space direction="vertical" size={2}>
                <Text strong style={{ fontSize: 13 }}>
                  {getRequestStatusLabel(h.toStatus)}
                </Text>
                {h.comment && (
                  <Text style={{ fontSize: 13 }}>{h.comment}</Text>
                )}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(h.timestamp)}
                </Text>
              </Space>
            ),
          }))}
        />
      </Card>

      {/* Comments — only public ones visible to resident */}
      <Card title="Responses">
        <Space direction="vertical" style={{ width: '100%' }}>
          {request.comments.length === 0 && (
            <Text type="secondary">No responses yet.</Text>
          )}
          {request.comments.map(c => (
            <Card
              key={c.id}
              size="small"
              styles={{ body: { padding: '8px 12px' } }}
              style={{ background: '#F9FAFB' }}
            >
              <Paragraph style={{ margin: 0, fontSize: 13 }}>{c.body}</Paragraph>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatDateTime(c.createdAt)}
              </Text>
            </Card>
          ))}

          {canComment && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Form form={form} onFinish={v => commentMutation.mutate(v)} layout="vertical">
                <Form.Item
                  name="body"
                  rules={[
                    { required: true, message: 'Enter a message' },
                    { min: 3, message: 'At least 3 characters' },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Add a follow-up comment…"
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={commentMutation.isPending}
                >
                  Send
                </Button>
              </Form>
            </>
          )}
        </Space>
      </Card>
    </Space>
  );
}
