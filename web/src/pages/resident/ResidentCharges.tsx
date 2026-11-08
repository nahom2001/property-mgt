import {
  Table, Space, Typography, Modal, Button, InputNumber, Input, App as AntApp,
  Upload, Alert,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { UploadFile, UploadProps } from 'antd';
import { api, getErrorMessage } from '../../lib/api';
import { StatusTag } from '../../components/shared/StatusTag';
import type { Charge } from '@phison/types';
import { formatETB, formatDate } from '../../lib/formatters';

const { Title, Text } = Typography;

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ACCEPTED_HINT    = 'JPG, PNG, WebP or PDF — max 10 MB';

export default function ResidentCharges() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();

  const [payModal, setPayModal]   = useState<Charge | null>(null);
  const [amount, setAmount]       = useState(0);
  const [reference, setReference] = useState('');
  const [fee, setFee]             = useState(0);
  const [fileList, setFileList]   = useState<UploadFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['my-charges'],
    queryFn: () => api.get<Charge[]>('/payments/charges').then(r => r.data),
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
      // Store locally — do not auto-upload
      setFileList([{ ...file, status: 'done', uid: file.uid, name: file.name }]);
      return false;
    },
    onRemove() {
      setFileList([]);
      setFileError(null);
    },
  };

  // ── Submit payment ─────────────────────────────────────────────────────────

  const payMutation = useMutation({
    mutationFn: async () => {
      // Read the file as base64 so it can be sent in the JSON body.
      // In production the backend would accept multipart/form-data instead.
      let attachmentData: string | null = null;
      let attachmentFilename: string | null = null;
      let attachmentMimeType: string | null = null;

      const rawFile = fileList[0]?.originFileObj as File | undefined;
      if (rawFile) {
        attachmentData = await fileToBase64(rawFile);
        attachmentFilename = rawFile.name;
        attachmentMimeType = rawFile.type;
      }

      return api.post(`/payments/resident/online/${payModal?.id}`, {
        amount:             Math.round(amount * 100),
        transactionFee:     Math.round(fee * 100),
        reference,
        attachmentData,
        attachmentFilename,
        attachmentMimeType,
        attachmentSizeBytes: rawFile?.size ?? 0,
      });
    },
    onSuccess: () => {
      message.success('Payment submitted — awaiting admin confirmation');
      qc.invalidateQueries({ queryKey: ['my-charges'] });
      handleCloseModal();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleCloseModal() {
    setPayModal(null);
    setAmount(0);
    setReference('');
    setFee(0);
    setFileList([]);
    setFileError(null);
  }

  function handleOpenModal(charge: Charge) {
    setPayModal(charge);
    setAmount((charge.amount - charge.paidAmount) / 100);
  }

  function handleSubmit() {
    if (!reference.trim()) { message.warning('Enter a payment reference'); return; }
    if (fileList.length === 0) { message.warning('Attach a screenshot or receipt before submitting'); return; }
    if (fileError) return;
    payMutation.mutate();
  }

  // ── Table ──────────────────────────────────────────────────────────────────

  const columns = [
    { title: 'Amount (ETB)',     dataIndex: 'amount',     key: 'amount',     render: (a: number) => formatETB(a) },
    { title: 'Paid (ETB)',       dataIndex: 'paidAmount', key: 'paid',       render: (a: number) => formatETB(a) },
    {
      title: 'Outstanding (ETB)', key: 'outstanding',
      render: (_: unknown, r: Charge) => {
        const os = r.amount - r.paidAmount;
        return <Text strong style={{ color: os > 0 ? '#ff4d4f' : '#52c41a' }}>{formatETB(os)}</Text>;
      },
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: formatDate },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <StatusTag status={s} />,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Charge) =>
        record.status !== 'paid' && record.status !== 'cancelled' ? (
          <Button type="primary" size="small" onClick={() => handleOpenModal(record)}>
            Pay
          </Button>
        ) : null,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>My Charges</Title>
      <Table dataSource={charges} columns={columns} rowKey="id" loading={isLoading} />

      {/* ── Payment modal ──────────────────────────────────────────── */}
      <Modal
        title="Submit Payment"
        open={!!payModal}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={payMutation.isPending}
        okText="Submit Payment"
        okButtonProps={{ disabled: fileList.length === 0 || !!fileError }}
        width={480}
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
          {/* Outstanding summary */}
          <div style={{ background: '#F5F6FA', borderRadius: 8, padding: '10px 14px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Outstanding balance</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1D2E' }}>
              {payModal ? formatETB(payModal.amount - payModal.paidAmount) : ''}
            </div>
          </div>

          {/* Amount */}
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 13 }}>Amount (ETB)</Text>
            <InputNumber
              min={0.01}
              precision={2}
              value={amount}
              onChange={v => setAmount(v ?? 0)}
              style={{ width: '100%' }}
              addonAfter="ETB"
            />
          </Space>

          {/* Transaction fee */}
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 13 }}>Transaction Fee (ETB)</Text>
            <InputNumber
              min={0}
              precision={2}
              value={fee}
              onChange={v => setFee(v ?? 0)}
              style={{ width: '100%' }}
              addonAfter="ETB"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Total you will pay:{' '}
              <strong>{formatETB(Math.round((amount + fee) * 100))}</strong>
            </Text>
          </Space>

          {/* Reference */}
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 13 }}>Payment Reference</Text>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. CBE transfer ID, receipt number"
            />
          </Space>

          {/* Screenshot / proof upload */}
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 13 }}>
              Payment Screenshot / Receipt{' '}
              <Text type="danger">*</Text>
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Attach a screenshot of your bank transfer or mobile payment.
            </Text>

            {fileError && (
              <Alert
                type="error"
                message={fileError}
                showIcon
                closable
                onClose={() => setFileError(null)}
                style={{ marginBottom: 4 }}
              />
            )}

            <Upload.Dragger {...uploadProps} style={{ padding: '12px 0' }}>
              <p style={{ margin: 0 }}>
                <InboxOutlined style={{ fontSize: 28, color: '#2D3B8E' }} />
              </p>
              <p style={{ margin: '6px 0 2px', fontWeight: 500 }}>
                Click or drag screenshot here
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
                {ACCEPTED_HINT}
              </p>
            </Upload.Dragger>

            {fileList.length === 0 && !fileError && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                You must attach a proof of payment before submitting.
              </Text>
            )}
          </Space>
        </Space>
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
