import { Table, Tag, Space, Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import type { Voucher } from '@phison/types';

const { Title } = Typography;

export default function VouchersAdminPage() {
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => api.get<Voucher[]>('/vouchers').then(r => r.data),
  });

  const columns = [
    { title: 'Voucher #', dataIndex: 'voucherNumber', key: 'number' },
    {
      title: 'Direction', dataIndex: 'direction', key: 'direction',
      render: (d: string) => <Tag color={d === 'outgoing' ? 'orange' : 'green'}>{d}</Tag>,
    },
    { title: 'Type', dataIndex: 'paymentType', key: 'type', render: (t: string) => t.replace(/_/g, ' ') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Date', dataIndex: 'paymentDate', key: 'date', render: formatDate },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'issued' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: () => (
        <Button size="small" icon={<DownloadOutlined />} disabled>PDF</Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>Vouchers</Title>
      <Table dataSource={vouchers} columns={columns} rowKey="id" loading={isLoading} />
    </Space>
  );
}
