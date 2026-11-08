import { List, Badge, Typography, Space, Card, Tag } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Notice } from '@phison/types';
import { formatDate } from '../../lib/formatters';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  payment: 'red', maintenance: 'orange', outage: 'volcano', general: 'blue',
};

export default function ResidentNotices() {
  const qc = useQueryClient();
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['my-notices'],
    queryFn: () => api.get<Notice[]>('/notices/my').then(r => r.data),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notices/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notices'] }),
  });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>Notice Board</Title>

      <List
        loading={isLoading}
        dataSource={notices}
        locale={{ emptyText: 'No notices' }}
        renderItem={notice => (
          <List.Item>
            <Card
              style={{ width: '100%', cursor: 'pointer' }}
              onClick={() => readMutation.mutate(notice.id)}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong style={{ fontSize: 15 }}>{notice.title}</Text>
                  <Space>
                    <Tag color={CATEGORY_COLORS[notice.category]}>{notice.category}</Tag>
                    {notice.isSystemGenerated && <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 12 }}>System</Text>} />}
                  </Space>
                </Space>
                <Paragraph style={{ margin: 0 }}>{notice.body}</Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(notice.publishedAt)}</Text>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </Space>
  );
}
