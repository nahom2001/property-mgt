import { Row, Col, Card, Statistic, Typography, Space, List, Badge } from 'antd';
import { DollarOutlined, NotificationOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import type { Charge, Notice } from '@phison/types';

const { Title, Text } = Typography;

export default function ResidentDashboard() {
  const { data: charges = [] } = useQuery({
    queryKey: ['my-charges'],
    queryFn: () => api.get<Charge[]>('/payments/charges').then(r => r.data),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['my-notices'],
    queryFn: () => api.get<Notice[]>('/notices/my').then(r => r.data),
  });

  const outstanding = charges
    .filter(c => c.status !== 'paid' && c.status !== 'cancelled')
    .reduce((s, c) => s + (c.amount - c.paidAmount), 0);

  const overdue = charges.filter(c => c.status === 'overdue').length;
  const unread = notices.filter(n => !n.retractedAt).length;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>Welcome back</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Outstanding Balance"
              value={formatETB(outstanding)}
              prefix={<DollarOutlined style={{ color: outstanding > 0 ? '#ff4d4f' : '#52c41a' }} />}
              valueStyle={{ color: outstanding > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Overdue Charges" value={overdue} prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Unread Notices" value={unread} prefix={<NotificationOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Notices">
        <List
          dataSource={notices.slice(0, 5)}
          renderItem={notice => (
            <List.Item>
              <List.Item.Meta
                title={notice.title}
                description={
                  <Space>
                    <Text type="secondary">{formatDate(notice.publishedAt)}</Text>
                    <Badge color="blue" text={notice.category} />
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No notices yet' }}
        />
      </Card>
    </Space>
  );
}
