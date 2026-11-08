import {
  Table, Button, Space, Typography, Tag, Popconfirm, Modal, Input, App as AntApp, Image, Tooltip,
} from 'antd';
import { CheckOutlined, CloseOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, getErrorMessage } from '../../lib/api';
import { formatETB, formatDateTime } from '../../lib/formatters';
import { PaymentsSubNav } from '../../components/shared/SubNav';

const { Title, Text } = Typography;

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
  attachmentData: string | null;   // base64 data URL (mock); real backend returns a URL
}

export default function PendingPaymentsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [rejectModal, setRejectModal]   = useState<string | null>(null);
  const [rejectNote, setRejectNote]     = useState('');
  const [proofModal, setProofModal]     = useState<PendingPayment | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: () => api.get<PendingPayment[]>('/payments/resident/pending').then(r => r.data),
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
      <Title level={4} style={{ margin: 0 }}>Pending Online Payment Confirmations</Title>
      <Table dataSource={payments} columns={columns} rowKey="id" loading={isLoading} />

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
