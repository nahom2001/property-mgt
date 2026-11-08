import { Table, Tag, Space, Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Voucher } from '@phison/types';
import { formatETB, formatDate } from '../../lib/formatters';

const { Title } = Typography;

export default function ResidentVouchers() {
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['my-vouchers'],
    queryFn: () => api.get<Voucher[]>('/vouchers/my').then(r => r.data),
  });

  const columns = [
    { title: 'Voucher #', dataIndex: 'voucherNumber', key: 'number' },
    { title: 'Type', dataIndex: 'paymentType', key: 'type', render: (t: string) => t.replace(/_/g, ' ') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Date', dataIndex: 'paymentDate', key: 'date', render: formatDate },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'issued' ? 'green' : 'default'}>{s}</Tag>,
    },
    {
      title: 'Download', key: 'download',
      render: () => <Button size="small" icon={<DownloadOutlined />} disabled>PDF</Button>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>My Vouchers</Title>
      <Table dataSource={vouchers} columns={columns} rowKey="id" loading={isLoading} />
    </Space>
  );
}
