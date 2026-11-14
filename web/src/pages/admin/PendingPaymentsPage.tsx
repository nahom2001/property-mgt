import {
  Table, Button, Space, Typography, Tag, Popconfirm, Modal, Input, App as AntApp, Image, Tooltip,
  Form, Select, InputNumber, Upload, Alert, DatePicker,
} from 'antd';
import { CheckOutlined, CloseOutlined, PaperClipOutlined, PlusOutlined, InboxOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { UploadFile, UploadProps } from 'antd';
import dayjs from 'dayjs';
import { api, getErrorMessage } from '../../lib/api';
import { formatETB, formatDateTime } from '../../lib/formatters';
import { PaymentsSubNav } from '../../components/shared/SubNav';

const { Title, Text } = Typography;

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ACCEPTED_HINT = 'JPG, PNG, WebP or PDF — max 10 MB';

interface PendingPayment {
  id: string;
  chargeId: string;
  amount: number;
  transactionFee: number;
  method: string;
  paidOn: string;
  reference: string;
  attachmentFilename: string | null;
  attachmentMimeType: string | null;
  attachmentData: string | null;
}

interface Charge {
  id: string;
  unitId: string;
  payerId: string;
  amount: number;
  paidAmount: number;
  status: string;
}

export default function PendingPaymentsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [rejectModal, setRejectModal]   = useState<string | null>(null);
  const [rejectNote, setRejectNote]     = useState('');
  const [proofModal, setProofModal]     = useState<PendingPayment | null>(null);
  const [addModal, setAddModal]         = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList]         = useState<UploadFile[]>([]);
  const [fileError, setFileError]       = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => api.get<PendingPayment[]>('/payments/resident/pending').then(r => r.data),
  });

  // Fetch charges for the dropdown (only unpaid ones)
  const { data: charges = [] } = useQuery({
    queryKey: ['charges'],
    queryFn: () => api.get<Charge[]>('/payments/charges').then(r => r.data),
    enabled: addModal,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/payments/resident/${id}/confirm`, { approved: true }),
    onSuccess: () => { message.success('Payment confirmed'); qc.invalidateQueries({ queryKey: ['pending-payments'] }); },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.patch(`/payments/resident/${id}/confirm`, { approved: false, note }),
    onSuccess: () => {
      message.success('Payment rejected');
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      setRejectModal(null);
      setRejectNote('');
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const registerMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/payments/resident/pending', v),
    onSuccess: () => {
      message.success('Payment registered for confirmation');
      qc.invalidateQueries({ queryKey: ['pending-payments'] });
      setAddModal(false);
      form.resetFields();
      setFileList([]);
      setFileError(null);
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

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

  // Outstanding charges available for payment
  const unpaidCharges = charges.filter(c => c.status !== 'paid' && c.status !== 'cancelled');

  const columns = [
    { title: 'Charge',     dataIndex: 'chargeId',       key: 'charge' },
    { title: 'Amount',     dataIndex: 'amount',          key: 'amount',  render: (a: number) => formatETB(a) },
    { title: 'Fee',        dataIndex: 'transactionFee',  key: 'fee',     render: (a: number) => formatETB(a) },
    { title: 'Method',     dataIndex: 'method',          key: 'method',  render: (m: string) => <Tag>{m}</Tag> },
    { title: 'Reference',  dataIndex: 'reference',       key: 'ref' },
    { title: 'Submitted',  dataIndex: 'paidOn',          key: 'paidOn',  render: formatDateTime },
    {
      title: 'Proof', key: 'proof',
      render: (_: unknown, r: PendingPayment) =>
        r.attachmentFilename ? (
          <Tooltip title={r.attachmentFilename}>
            <Button
              size="small"
              icon={<PaperClipOutlined />}
              onClick={() => setProofModal(r)}
            >
              View
            </Button>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>No attachment</Text>
        ),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: PendingPayment) => (
        <Space>
          <Popconfirm
            title="Confirm this payment?"
            onConfirm={() => confirmMutation.mutate(record.id)}
          >
            <Button size="small" type="primary" icon={<CheckOutlined />}>Confirm</Button>
          </Popconfirm>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => setRejectModal(record.id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Pending Payment Confirmations</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
          Register Payment
        </Button>
      </Space>
      <Table dataSource={payments} columns={columns} rowKey="id" loading={isLoading} />

      {/* ── Register payment modal ───────────────────────────────────── */}
      <Modal
        title="Register Confirmable Payment"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields(); setFileList([]); setFileError(null); }}
        onOk={() => form.submit()}
        confirmLoading={registerMutation.isPending}
        width={480}
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

            registerMutation.mutate({
              chargeId: v.chargeId,
              amount: Math.round((v.amount as number) * 100),
              method: v.method,
              paidOn: dayjs(v.paidOn).toISOString(),
              reference: v.reference,
              transactionFee: 0,
              attachmentData,
              attachmentFilename,
              attachmentMimeType,
            });
          }}
        >
          <Form.Item name="chargeId" label="Charge" rules={[{ required: true, message: 'Select a charge' }]}>
            <Select
              placeholder="Select an outstanding charge"
              options={unpaidCharges.map(c => ({
                label: `${c.id} — Outstanding: ${formatETB(c.amount - c.paidAmount)}`,
                value: c.id,
              }))}
              notFoundContent="No outstanding charges"
            />
          </Form.Item>

          <Form.Item name="amount" label="Amount (ETB)" rules={[{ required: true, message: 'Enter the amount' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} addonAfter="ETB" />
          </Form.Item>

          <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Cash', value: 'cash' },
                { label: 'Bank Transfer', value: 'bank_transfer' },
              ]}
            />
          </Form.Item>

          <Form.Item name="paidOn" label="Payment Date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reference" label="Reference" rules={[{ required: true, message: 'Enter a reference' }]}>
            <Input placeholder="e.g. CBE-TRF-12345" />
          </Form.Item>

          <Form.Item label="Receipt / Proof Image">
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
              Upload a receipt, transfer confirmation, or proof of payment.
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

      {/* Reject modal */}
      <Modal
        title="Reject Payment"
        open={!!rejectModal}
        onCancel={() => { setRejectModal(null); setRejectNote(''); }}
        onOk={() => rejectModal && rejectMutation.mutate({ id: rejectModal, note: rejectNote })}
        confirmLoading={rejectMutation.isPending}
        okButtonProps={{ danger: true }}
        okText="Reject"
      >
        <Input.TextArea
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
          placeholder="Reason for rejection (required)"
          rows={3}
        />
      </Modal>

      {/* Proof / attachment preview modal */}
      <Modal
        title={proofModal?.attachmentFilename ?? 'Payment Proof'}
        open={!!proofModal}
        onCancel={() => setProofModal(null)}
        footer={<Button onClick={() => setProofModal(null)}>Close</Button>}
        width={600}
      >
        {proofModal && (
          <>
            {proofModal.attachmentMimeType?.startsWith('image/') && proofModal.attachmentData ? (
              <Image
                src={proofModal.attachmentData}
                alt="Payment proof"
                style={{ width: '100%', borderRadius: 8 }}
              />
            ) : proofModal.attachmentMimeType === 'application/pdf' && proofModal.attachmentData ? (
              <iframe
                src={proofModal.attachmentData}
                title="Payment proof"
                style={{ width: '100%', height: 480, border: 'none', borderRadius: 8 }}
              />
            ) : (
              <Text type="secondary">
                Attachment saved: {proofModal.attachmentFilename}
              </Text>
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
