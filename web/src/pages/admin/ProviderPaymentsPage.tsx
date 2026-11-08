import { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select, InputNumber, Row, Col,
  App as AntApp,
} from 'antd';
import { PlusOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, getErrorMessage } from '../../lib/api';
import { PaymentType } from '@phison/types';
import type { ProviderPayment } from '@phison/types';
import { formatETB, formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { StatCard } from '../../components/shared/StatCard';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import DatePicker from 'antd/es/date-picker/index';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const TYPE_LABELS: Record<string, string> = {
  service_fee: 'Service Fee',
  electricity_fee: 'Electricity',
  water_payment: 'Water',
};

export default function ProviderPaymentsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['provider-payments'],
    queryFn: () => api.get<ProviderPayment[]>('/payments/provider').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/payments/provider', v),
    onSuccess: () => {
      message.success('Provider payment recorded');
      qc.invalidateQueries({ queryKey: ['provider-payments'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const unallocated = payments.filter(p => p.status === 'unallocated').length;

  const columns = [
    {
      title: 'Type', dataIndex: 'type', key: 'type',
      render: (t: string) => <StatusTag status={t === 'service_fee' ? 'material' : 'house'} />,
    },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    {
      title: 'Billing Period', key: 'period',
      render: (_: unknown, r: ProviderPayment) =>
        `${formatDate(r.billingPeriodStart)} – ${formatDate(r.billingPeriodEnd)}`,
    },
    { title: 'Amount (ETB)', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Paid On', dataIndex: 'paidOn', key: 'paidOn', render: formatDate },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: ProviderPayment) =>
        record.status === 'unallocated' ? (
          <Button
            size="small"
            type="primary"
            icon={<CalculatorOutlined />}
            onClick={() => navigate(`/admin/payments/allocation/${record.id}`)}
          >
            Allocate
          </Button>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Provider Payments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Record Payment
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><StatCard label="Total Payments" value={payments.length} /></Col>
        <Col xs={24} sm={8}><StatCard label="Total Paid Out (ETB)" value={formatETB(totalPaid)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Awaiting Allocation" value={unallocated} /></Col>
      </Row>

      <Table dataSource={payments} columns={columns} rowKey="id" loading={isLoading} />

      <Modal
        title="Record Provider Payment"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={v => createMutation.mutate({
            ...v,
            billingPeriodStart: dayjs(v.billingPeriod[0]).toISOString(),
            billingPeriodEnd: dayjs(v.billingPeriod[1]).toISOString(),
            paidOn: dayjs(v.paidOn).toISOString(),
            amount: Math.round((v.amount as number) * 100),
          })}
        >
          <Form.Item name="type" label="Payment Type" rules={[{ required: true }]}>
            <Select options={Object.values(PaymentType).map(t => ({ label: TYPE_LABELS[t] ?? t, value: t }))} />
          </Form.Item>
          <Form.Item name="provider" label="Provider" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="billingPeriod" label="Billing Period" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} picker="month" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (ETB)" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} addonAfter="ETB" />
          </Form.Item>
          <Form.Item name="paidOn" label="Payment Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reference" label="Reference" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
