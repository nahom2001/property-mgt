import { Table, Space, Typography, Select, Row, Col, Button, Modal, Form, InputNumber, Input, App as AntApp } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, getErrorMessage } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { StatCard } from '../../components/shared/StatCard';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import { ChargeStatus } from '@phison/types';
import type { Charge } from '@phison/types';
import DatePicker from 'antd/es/date-picker/index';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function ChargesAdminPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [payModal, setPayModal] = useState<Charge | null>(null);
  const [form] = Form.useForm();

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['charges', statusFilter],
    queryFn: () =>
      api.get<Charge[]>(`/payments/charges${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/payments/resident/manual', v),
    onSuccess: () => {
      message.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['charges'] });
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      setPayModal(null);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
  const totalCollected = charges.reduce((s, c) => s + c.paidAmount, 0);
  const totalOutstanding = totalCharged - totalCollected;

  const payableStatuses = new Set(['issued', 'partially_paid', 'overdue']);

  const columns = [
    {
      title: 'Unit', dataIndex: 'unitId', key: 'unitId',
      render: (id: string) => <span style={{ fontWeight: 500 }}>{id}</span>,
    },
    { title: 'Payer', dataIndex: 'payerId', key: 'payerId' },
    {
      title: 'Role', dataIndex: 'payerRole', key: 'payerRole',
      render: (r: string) => <StatusTag status={r} />,
    },
    { title: 'Amount (ETB)', dataIndex: 'amount', key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Paid (ETB)', dataIndex: 'paidAmount', key: 'paidAmount', render: (a: number) => formatETB(a) },
    {
      title: 'Outstanding (ETB)', key: 'outstanding',
      render: (_: unknown, r: Charge) => formatETB(r.amount - r.paidAmount),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: formatDate },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, charge: Charge) =>
        payableStatuses.has(charge.status) ? (
          <Button
            size="small"
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              setPayModal(charge);
              form.setFieldsValue({
                amount: (charge.amount - charge.paidAmount) / 100,
                paidOn: dayjs(),
              });
            }}
          >
            Record Payment
          </Button>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Charges</Title>
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 180 }}
          onChange={setStatusFilter}
          options={Object.values(ChargeStatus).map(s => ({ label: s.replace(/_/g, ' '), value: s }))}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><StatCard label="Total Charged (ETB)" value={formatETB(totalCharged)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Total Collected (ETB)" value={formatETB(totalCollected)} /></Col>
        <Col xs={24} sm={8}><StatCard label="Outstanding (ETB)" value={formatETB(totalOutstanding)} /></Col>
      </Row>

      <Table dataSource={charges} columns={columns} rowKey="id" loading={isLoading} />

      {/* ── Record payment modal ─────────────────────────────────────── */}
      <Modal
        title="Record Payment"
        open={!!payModal}
        onCancel={() => { setPayModal(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={recordPaymentMutation.isPending}
        okText="Record Payment"
      >
        {payModal && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary">Outstanding</Text>
              <Text strong style={{ fontSize: 16 }}>
                {formatETB(payModal.amount - payModal.paidAmount)}
              </Text>
            </Space>

            <Form
              form={form}
              layout="vertical"
              onFinish={v => recordPaymentMutation.mutate({
                chargeId: payModal.id,
                amount: Math.round((v.amount as number) * 100),
                method: v.method,
                paidOn: dayjs(v.paidOn).toISOString(),
                reference: v.reference,
              })}
            >
              <Form.Item
                name="amount"
                label="Amount (ETB)"
                rules={[
                  { required: true, message: 'Enter the amount' },
                  {
                    validator: (_, val) => {
                      const outstanding = (payModal.amount - payModal.paidAmount) / 100;
                      if (val > outstanding) return Promise.reject(`Cannot exceed outstanding balance of ETB ${outstanding.toFixed(2)}`);
                      if (val <= 0) return Promise.reject('Must be greater than 0');
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  addonAfter="ETB"
                />
              </Form.Item>

              <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Bank Transfer', value: 'bank_transfer' },
                ]} />
              </Form.Item>

              <Form.Item name="paidOn" label="Payment Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="reference" label="Reference" rules={[{ required: true, message: 'Enter a reference' }]}>
                <Input placeholder="e.g. CBE-TRF-12345 or Receipt #001" />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Space>
  );
}
