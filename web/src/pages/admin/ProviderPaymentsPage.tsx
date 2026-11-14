import { useState, useMemo, useEffect } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Input, Select, InputNumber, Row, Col,
  App as AntApp, Upload, Alert, Image, Tooltip, Card, Descriptions, Tag,
} from 'antd';
import { PlusOutlined, CalculatorOutlined, InboxOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, getErrorMessage } from '../../lib/api';
import { PaymentType } from '@phison/types';
import type { ProviderPayment, ElectricityTariffRate, WaterTariffRate, ServiceFeeRate, Unit } from '@phison/types';
import { formatETB, formatDate } from '../../lib/formatters';
import { StatusTag } from '../../components/shared/StatusTag';
import { StatCard } from '../../components/shared/StatCard';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import DatePicker from 'antd/es/date-picker/index';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ACCEPTED_HINT = 'JPG, PNG, WebP or PDF — max 10 MB';

interface ProviderPaymentWithAttachment extends ProviderPayment {
  attachmentFilename: string | null;
  attachmentMimeType: string | null;
  attachmentData: string | null;
}

interface MeterReading {
  id: string;
  unitId: string;
  type: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  consumption: number;
  unit: string;
}

interface CurrentPeriod {
  electricityPeriodLabel: string;
  waterPeriodLabel: string;
}

interface ResidentLink {
  id: string;
  userId: string;
  unitId: string;
  role: string;
  endDate: string | null;
}

interface MockUser {
  id: string;
  fullName: string;
  hasVehicle: boolean | null;
}

interface CalcLine {
  unitIdentifier: string;
  unitId: string;
  consumption: number;
  rate: number;
  charge: number;
  unit: string;
}

interface CalcResult {
  lines: CalcLine[];
  totalEtb: number;
  rateLabel: string;
  rate: number;
  unit: string;
}

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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<ProviderPaymentWithAttachment | null>(null);
  const [excludedUnits, setExcludedUnits] = useState<Set<string>>(new Set());

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['provider-payments'],
    queryFn: () => api.get<ProviderPaymentWithAttachment[]>('/payments/provider').then(r => r.data),
  });

  // ── Data for auto-calculation ──────────────────────────────────────────────

  const { data: meterReadings = [] } = useQuery({
    queryKey: ['meter-readings'],
    queryFn: () => api.get<MeterReading[]>('/payments/meter-readings').then(r => r.data),
    enabled: open,
  });

  const { data: currentPeriod } = useQuery({
    queryKey: ['pricing-current-period'],
    queryFn: () => api.get<CurrentPeriod>('/pricing/current-period').then(r => r.data),
    enabled: open,
  });

  const { data: elecRates = [] } = useQuery({
    queryKey: ['pricing-electricity'],
    queryFn: () => api.get<ElectricityTariffRate[]>('/pricing/electricity').then(r => r.data),
    enabled: open,
  });

  const { data: waterRates = [] } = useQuery({
    queryKey: ['pricing-water'],
    queryFn: () => api.get<WaterTariffRate[]>('/pricing/water').then(r => r.data),
    enabled: open,
  });

  const { data: serviceFee } = useQuery({
    queryKey: ['pricing-service-fee'],
    queryFn: () => api.get<ServiceFeeRate>('/pricing/service-fee').then(r => r.data),
    enabled: open,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get<Unit[]>('/units').then(r => r.data),
    enabled: open,
  });

  const { data: residents = [] } = useQuery({
    queryKey: ['residents'],
    queryFn: () => api.get<MockUser[]>('/residents').then(r => r.data),
    enabled: open,
  });

  const { data: residentLinks = [] } = useQuery({
    queryKey: ['resident-links'],
    queryFn: () => api.get<ResidentLink[]>('/units/links/search').then(r => r.data),
    enabled: open,
  });

  // ── Watch form fields ────────────────────────────────────────────────────────

  const watchType = Form.useWatch('type', form);
  const watchPeriod = Form.useWatch('billingPeriod', form);

  // ── Auto-calculate amount from rate × meter readings ────────────────────────

  const calculation = useMemo<CalcResult | null>(() => {
    if (!watchType) return null;

    // Service fee doesn't need a billing period — flat rate per resident
    if (watchType === 'service_fee') {
      const activeLinks = residentLinks.filter(l => l.endDate === null);
      const withVehicle = activeLinks.filter(l => residents.find(u => u.id === l.userId)?.hasVehicle).length;
      const withoutVehicle = activeLinks.length - withVehicle;
      const wAmount = serviceFee?.withVehicleAmount ?? 0;
      const woAmount = serviceFee?.withoutVehicleAmount ?? 0;

      const lines: CalcLine[] = [
        { unitIdentifier: `${withVehicle} residents with vehicle`, unitId: 'with-vehicle', consumption: withVehicle, rate: wAmount, charge: withVehicle * wAmount, unit: 'resident' },
        { unitIdentifier: `${withoutVehicle} residents without vehicle`, unitId: 'without-vehicle', consumption: withoutVehicle, rate: woAmount, charge: withoutVehicle * woAmount, unit: 'resident' },
      ];

      return {
        lines, totalEtb: withVehicle * wAmount + withoutVehicle * woAmount,
        rate: 0, rateLabel: 'Current service fee', unit: '',
      };
    }

    // Electricity and water: show readings per unit
    // If no billing period selected, show all readings for that type
    const periodMonth = watchPeriod?.[0] as dayjs.Dayjs | undefined;

    if (watchType === 'electricity_fee') {
      // Current quarter's commercial flat rate
      const rate = elecRates.find(r =>
        r.category === 'commercial' && r.periodLabel === currentPeriod?.electricityPeriodLabel
      )?.ratePerKwh ?? 0;

      // Find meter readings — filtered by billing period if selected, else all for this type
      const readings = meterReadings.filter(r => {
        if (r.type !== 'electricity_fee') return false;
        if (!periodMonth) return true;
        const rd = dayjs(r.billingPeriodStart);
        return rd.year() === periodMonth.year() && rd.month() === periodMonth.month();
      });

      const lines: CalcLine[] = readings
        .filter(r => !excludedUnits.has(r.unitId))
        .map(r => {
          const unit = units.find(u => u.id === r.unitId);
          return {
            unitIdentifier: unit?.identifier ?? r.unitId,
            unitId: r.unitId,
            consumption: r.consumption,
            rate,
            charge: r.consumption * rate,
            unit: 'kWh',
          };
        });

      return {
        lines, totalEtb: lines.reduce((s, l) => s + l.charge, 0),
        rate, rateLabel: currentPeriod?.electricityPeriodLabel ?? '', unit: 'kWh',
      };
    }

    if (watchType === 'water_payment') {
      // Current water period's tier rates
      const wRates = waterRates.filter(r => r.periodLabel === currentPeriod?.waterPeriodLabel);

      const readings = meterReadings.filter(r => {
        if (r.type !== 'water_payment') return false;
        if (!periodMonth) return true;
        const rd = dayjs(r.billingPeriodStart);
        return rd.year() === periodMonth.year() && rd.month() === periodMonth.month();
      });

      const lines: CalcLine[] = readings
        .filter(r => !excludedUnits.has(r.unitId))
        .map(r => {
          const unit = units.find(u => u.id === r.unitId);
          const tier = wRates.find(t =>
            t.toM3 === null ? r.consumption >= t.fromM3
              : r.consumption >= t.fromM3 && r.consumption <= t.toM3
          );
          const rate = tier?.ratePerM3 ?? 0;
          return {
            unitIdentifier: unit?.identifier ?? r.unitId,
            unitId: r.unitId,
            consumption: r.consumption,
            rate,
            charge: r.consumption * rate,
            unit: 'm³',
          };
        });

      return {
        lines, totalEtb: lines.reduce((s, l) => s + l.charge, 0),
        rate: 0, rateLabel: currentPeriod?.waterPeriodLabel ?? '', unit: 'm³',
      };
    }

    return null;
  }, [watchType, watchPeriod, meterReadings, elecRates, waterRates, currentPeriod, serviceFee, units, residents, residentLinks, excludedUnits]);

  // Auto-fill the amount field when calculation changes
  useEffect(() => {
    if (calculation) {
      form.setFieldValue('amount', calculation.totalEtb);
    }
  }, [calculation, form]);

  const createMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/payments/provider', v),
    onSuccess: () => {
      message.success('Provider payment recorded');
      qc.invalidateQueries({ queryKey: ['provider-payments'] });
      setOpen(false);
      form.resetFields();
      setFileList([]);
      setFileError(null);
      setExcludedUnits(new Set());
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const unallocated = payments.filter(p => p.status === 'unallocated').length;

  // ── Upload validation ──────────────────────────────────────────────────────

  const uploadProps: UploadProps = {
    maxCount: 1,
    accept: ACCEPTED_TYPES.join(','),
    fileList,
    beforeUpload(file) {
      setFileError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError('Only images (JPG, PNG, WebP, GIF) or PDF files are accepted.');
        return Upload.LIST_IGNORE;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`File must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
        return Upload.LIST_IGNORE;
      }
      setFileList([{ ...file, status: 'done', uid: file.uid, name: file.name }]);
      return false;
    },
    onRemove() {
      setFileList([]);
      setFileError(null);
    },
  };

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
      title: 'Receipt', key: 'receipt',
      render: (_: unknown, r: ProviderPaymentWithAttachment) =>
        r.attachmentFilename ? (
          <Tooltip title={r.attachmentFilename}>
            <Button
              size="small"
              icon={<PaperClipOutlined />}
              onClick={() => setReceiptModal(r)}
            >
              View
            </Button>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
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

      {/* ── Record payment modal ─────────────────────────────────────── */}
      <Modal
        title="Record Provider Payment"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); setFileList([]); setFileError(null); setExcludedUnits(new Set()); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (v) => {
            let attachmentData: string | null = null;
            let attachmentFilename: string | null = null;
            let attachmentMimeType: string | null = null;

            const rawFile = fileList[0]?.originFileObj as File | undefined;
            if (rawFile) {
              attachmentData = await fileToBase64(rawFile);
              attachmentFilename = rawFile.name;
              attachmentMimeType = rawFile.type;
            }

            createMutation.mutate({
              type: v.type,
              provider: v.provider,
              billingPeriodStart: dayjs(v.billingPeriod[0]).toISOString(),
              billingPeriodEnd: dayjs(v.billingPeriod[1]).toISOString(),
              paidOn: dayjs(v.paidOn).toISOString(),
              amount: Math.round((v.amount as number) * 100),
              reference: v.reference,
              attachmentData,
              attachmentFilename,
              attachmentMimeType,
            });
          }}
        >
          <Form.Item name="type" label="Payment Type" rules={[{ required: true }]}>
            <Select options={Object.values(PaymentType).map(t => ({ label: TYPE_LABELS[t] ?? t, value: t }))} />
          </Form.Item>
          <Form.Item name="provider" label="Provider" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="billingPeriod" label="Billing Period" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} picker="month" />
          </Form.Item>

          {/* ── Auto-calculation summary ───────────────────────────────── */}
          {calculation && calculation.lines.length === 0 && (
            <Alert
              type="warning"
              showIcon
              message="No meter readings found."
              description="Add readings on the Meter Readings page first, or enter the amount manually."
              style={{ marginBottom: 16 }}
            />
          )}
          {calculation && (
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space size={4}>
                    <CalculatorOutlined style={{ color: '#2D3B8E' }} />
                    <Text strong style={{ fontSize: 13 }}>Auto-calculated from meter readings</Text>
                  </Space>
                  <Tag color="blue">{calculation.rateLabel}</Tag>
                </Space>

                {calculation.lines.length === 0 ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="No meter readings found for this billing period."
                    description="Add readings on the Meter Readings page first, or enter the amount manually."
                    style={{ fontSize: 12 }}
                  />
                ) : (
                  <Table
                    size="small"
                    dataSource={calculation.lines}
                    rowKey={(l) => l.unitIdentifier}
                    pagination={false}
                    columns={[
                      { title: 'Unit', dataIndex: 'unitIdentifier', key: 'unit' },
                      {
                        title: 'Consumption', key: 'consumption',
                        render: (_: unknown, l: CalcLine) =>
                          l.unit === 'resident' ? `${l.consumption}` : `${l.consumption} ${l.unit}`,
                      },
                      {
                        title: 'Rate (ETB)', dataIndex: 'rate', key: 'rate',
                        render: (r: number) => r > 0 ? r.toFixed(2) : '—',
                      },
                      {
                        title: 'Charge (ETB)', dataIndex: 'charge', key: 'charge',
                        render: (c: number) => <Text strong>{formatETB(Math.round(c * 100))}</Text>,
                      },
                      {
                        title: '', key: 'remove',
                        width: 36,
                        render: (_: unknown, l: CalcLine) =>
                          l.unit !== 'resident' ? (
                            <Button
                              size="small"
                              danger
                              type="text"
                              style={{ padding: 0, minWidth: 24 }}
                              onClick={() => {
                                setExcludedUnits(prev => {
                                  const next = new Set(prev);
                                  next.add(l.unitId);
                                  return next;
                                });
                              }}
                            >
                              −
                            </Button>
                          ) : null,
                      },
                    ]}
                  />
                )}

                <Descriptions size="small" column={1} style={{ marginTop: 4 }}>
                  <Descriptions.Item label="Calculated Total">
                    <Text strong style={{ fontSize: 16, color: '#2D3B8E' }}>
                      {formatETB(Math.round(calculation.totalEtb * 100))}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
                {excludedUnits.size > 0 && (
                  <Space size={4} style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {excludedUnits.size} unit{excludedUnits.size > 1 ? 's' : ''} excluded from total.
                    </Text>
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, fontSize: 12, height: 'auto' }}
                      onClick={() => setExcludedUnits(new Set())}
                    >
                      Restore all
                    </Button>
                  </Space>
                )}
              </Space>
            </Card>
          )}

          <Form.Item name="amount" label="Amount (ETB)" rules={[{ required: true }]}>
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="ETB"
              placeholder={calculation ? undefined : 'Enter amount'}
            />
          </Form.Item>
          <Form.Item name="paidOn" label="Payment Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reference" label="Reference" rules={[{ required: true }]}><Input /></Form.Item>

          {/* Receipt / invoice upload */}
          <Form.Item label="Receipt / Invoice Image">
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
              Upload a photo or scan of the utility bill or receipt for this payment.
            </Text>
            {fileError && (
              <Alert
                type="error"
                message={fileError}
                showIcon
                closable
                onClose={() => setFileError(null)}
                style={{ marginBottom: 8 }}
              />
            )}
            <Upload.Dragger {...uploadProps} style={{ padding: '12px 0' }}>
              <p style={{ margin: 0 }}>
                <InboxOutlined style={{ fontSize: 28, color: '#2D3B8E' }} />
              </p>
              <p style={{ margin: '6px 0 2px', fontWeight: 500 }}>
                Click or drag receipt here
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
                {ACCEPTED_HINT}
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Receipt preview modal ────────────────────────────────────── */}
      <Modal
        title={receiptModal?.attachmentFilename ?? 'Receipt'}
        open={!!receiptModal}
        onCancel={() => setReceiptModal(null)}
        footer={<Button onClick={() => setReceiptModal(null)}>Close</Button>}
        width={600}
      >
        {receiptModal && (
          <>
            {receiptModal.attachmentMimeType?.startsWith('image/') && receiptModal.attachmentData ? (
              <Image
                src={receiptModal.attachmentData}
                alt="Receipt"
                style={{ width: '100%', borderRadius: 8 }}
              />
            ) : receiptModal.attachmentMimeType === 'application/pdf' && receiptModal.attachmentData ? (
              <iframe
                src={receiptModal.attachmentData}
                title="Receipt"
                style={{ width: '100%', height: 480, border: 'none', borderRadius: 8 }}
              />
            ) : (
              <Text type="secondary">Attachment: {receiptModal.attachmentFilename}</Text>
            )}
          </>
        )}
      </Modal>
    </Space>
  );
}

// ── Utility ────────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
