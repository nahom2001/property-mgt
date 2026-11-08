import { useParams, useNavigate } from 'react-router';
import {
  Card, Button, Table, Typography, Space, Alert, Tag, Descriptions, App as AntApp,
  Form, Select, InputNumber, Divider, Input,
} from 'antd';
import { CheckOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { formatETB, formatDate } from '../../lib/formatters';
import type { ComputeAllocationResponse, User, Voucher } from '@phison/types';
import { PaymentType, VoucherDirection } from '@phison/types';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import DatePicker from 'antd/es/date-picker/index';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// ── Voucher assignment form values ────────────────────────────────────────────

interface AssignVoucherValues {
  residentId: string;
  paymentType: PaymentType;
  /** Amount in ETB (not santim — converted on submit) */
  amount: number;
  paymentDate: dayjs.Dayjs;
  reference: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AllocationPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [dueDate, setDueDate] = useState<dayjs.Dayjs | null>(null);
  const [allocationConfirmed, setAllocationConfirmed] = useState(false);
  const [voucherForm] = Form.useForm<AssignVoucherValues>();

  // ── Allocation preview ────────────────────────────────────────────────────

  const { data, isLoading, error } = useQuery({
    queryKey: ['allocation-preview', paymentId],
    queryFn: () =>
      api.post<ComputeAllocationResponse>(`/payments/allocations/compute/${paymentId}`).then(r => r.data),
    enabled: !!paymentId,
  });

  // ── Residents list for voucher assignment ─────────────────────────────────

  const { data: residents = [] } = useQuery({
    queryKey: ['residents'],
    queryFn: () => api.get<User[]>('/residents').then(r => r.data),
    select: users => users.filter(u => u.role === 'resident' && u.status === 'active'),
  });

  // ── Issued vouchers for this provider payment ─────────────────────────────

  const { data: issuedVouchers = [] } = useQuery({
    queryKey: ['vouchers-for-payment', paymentId],
    queryFn: () =>
      api.get<Voucher[]>(`/vouchers?providerPaymentId=${paymentId}`).then(r => r.data),
    enabled: allocationConfirmed,
  });

  // ── Confirm allocation mutation ───────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post('/payments/allocations/confirm', {
        allocationId: data?.allocationId,
        dueDate: dueDate?.toISOString(),
      }),
    onSuccess: () => {
      message.success('Allocation confirmed — charges created');
      qc.invalidateQueries({ queryKey: ['provider-payments'] });
      setAllocationConfirmed(true);
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Assign voucher mutation ───────────────────────────────────────────────

  const assignVoucherMutation = useMutation({
    mutationFn: (v: AssignVoucherValues) =>
      api.post<Voucher>('/vouchers/assign', {
        direction:          VoucherDirection.Incoming,
        paymentType:        v.paymentType,
        residentId:         v.residentId,
        providerPaymentId:  paymentId,
        amount:             Math.round(v.amount * 100),   // ETB → santim
        paymentDate:        v.paymentDate.toISOString(),
        reference:          v.reference,
      }),
    onSuccess: (res) => {
      message.success(`Voucher ${res.data.voucherNumber} issued`);
      qc.invalidateQueries({ queryKey: ['vouchers-for-payment', paymentId] });
      qc.invalidateQueries({ queryKey: ['vouchers'] });
      voucherForm.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Allocation preview columns ────────────────────────────────────────────

  const allocationColumns = [
    { title: 'Unit',  dataIndex: 'unitIdentifier', key: 'unit' },
    {
      title: 'Payer', dataIndex: 'payerName', key: 'payer',
      render: (n: string | null) => n ?? <Text type="danger">Unlinked</Text>,
    },
    {
      title: 'Role', dataIndex: 'payerRole', key: 'role',
      render: (r: string | null) => r ? <Tag>{r}</Tag> : '—',
    },
    { title: 'Share (ETB)', dataIndex: 'shareAmount', key: 'share', render: (a: number) => formatETB(a) },
  ];

  // ── Issued vouchers columns ───────────────────────────────────────────────

  const voucherColumns = [
    { title: 'Voucher #', dataIndex: 'voucherNumber', key: 'number' },
    { title: 'Type',      dataIndex: 'paymentType',   key: 'type',   render: (t: string) => t.replace(/_/g, ' ') },
    { title: 'Resident',  dataIndex: 'payerId',       key: 'payer',
      render: (id: string | null) => {
        if (!id) return '—';
        const r = residents.find(u => u.id === id);
        return r ? r.fullName : id;
      },
    },
    { title: 'Amount (ETB)', dataIndex: 'amount',      key: 'amount', render: (a: number) => formatETB(a) },
    { title: 'Date',         dataIndex: 'paymentDate', key: 'date',   render: formatDate },
    { title: 'Reference',    dataIndex: 'reference',   key: 'ref' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'issued' ? 'green' : 'default'}>{s}</Tag>,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (error) return <Alert type="error" message={getErrorMessage(error)} showIcon />;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PaymentsSubNav />

      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
        <Title level={4} style={{ margin: 0 }}>Allocation Preview</Title>
      </Space>

      {/* ── Allocation summary + table ─────────────────────────────── */}
      {data && (
        <>
          {!data.valid && (
            <Alert
              type="error"
              showIcon
              message={`Totals do not balance. Difference: ${formatETB(data.difference)}`}
            />
          )}
          {data.unlinkedUnits.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`Units with no active residents (skipped): ${data.unlinkedUnits.join(', ')}`}
            />
          )}

          <Card>
            <Descriptions column={3}>
              <Descriptions.Item label="Provider Payment">
                {formatETB(data.providerPaymentAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Computed Total">
                {formatETB(data.totalComputed)}
              </Descriptions.Item>
              <Descriptions.Item label="Difference">
                <Text type={data.difference === 0 ? 'success' : 'danger'}>
                  {formatETB(data.difference)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Table
            dataSource={data.lines}
            columns={allocationColumns}
            rowKey={r => `${r.unitId}-${r.payerId}`}
            loading={isLoading}
            pagination={false}
          />

          {/* Confirm allocation */}
          {!allocationConfirmed && (
            <Card title="Set Due Date and Confirm">
              <Space>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  disabledDate={d => d.isBefore(dayjs(), 'day')}
                  placeholder="Select due date"
                />
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  disabled={!data.valid || !dueDate}
                  loading={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate()}
                >
                  Confirm Allocation
                </Button>
              </Space>
            </Card>
          )}

          {allocationConfirmed && (
            <Alert
              type="success"
              showIcon
              message="Allocation confirmed — charges have been created for all residents."
            />
          )}
        </>
      )}

      {/* ── Assign Voucher section ─────────────────────────────────── */}
      <Divider>
        <Space size={6}>
          <FileTextOutlined />
          <Text strong>Assign Voucher to Resident</Text>
        </Space>
      </Divider>

      <Card>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Issue an incoming payment voucher to a specific resident for this
          provider payment. The voucher will appear in the resident's voucher list.
        </Text>

        <Form
          form={voucherForm}
          layout="vertical"
          onFinish={v => assignVoucherMutation.mutate(v)}
          style={{ maxWidth: 520 }}
        >
          <Form.Item
            name="residentId"
            label="Resident"
            rules={[{ required: true, message: 'Select a resident' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search by name…"
              options={residents.map(r => ({
                label: r.fullName,
                value: r.id,
              }))}
              notFoundContent="No active residents found"
            />
          </Form.Item>

          <Form.Item
            name="paymentType"
            label="Payment Type"
            rules={[{ required: true, message: 'Select a payment type' }]}
          >
            <Select
              options={[
                { label: 'Service Fee',  value: PaymentType.ServiceFee },
                { label: 'Electricity',  value: PaymentType.ElectricityFee },
                { label: 'Water',        value: PaymentType.WaterPayment },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (ETB)"
            rules={[
              { required: true, message: 'Enter the amount' },
              { type: 'number', min: 0.01, message: 'Must be greater than zero' },
            ]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="ETB"
              placeholder="e.g. 250.00"
            />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="Payment Date"
            rules={[{ required: true, message: 'Select a payment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reference"
            label="Reference"
            rules={[{ required: true, message: 'Enter a reference (e.g. bank transfer ID)' }]}
          >
            <Input placeholder="e.g. CBE-TRF-001" />
          </Form.Item>

          <Button
            type="primary"
            icon={<FileTextOutlined />}
            htmlType="submit"
            loading={assignVoucherMutation.isPending}
          >
            Issue Voucher
          </Button>
        </Form>
      </Card>

      {/* ── Vouchers already issued for this payment ───────────────── */}
      {issuedVouchers.length > 0 && (
        <Card title={`Vouchers Issued (${issuedVouchers.length})`}>
          <Table
            dataSource={issuedVouchers}
            columns={voucherColumns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      )}
    </Space>
  );
}
