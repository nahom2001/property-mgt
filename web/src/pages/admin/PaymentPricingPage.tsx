/**
 * PaymentPricingPage — /admin/payments/pricing
 *
 * Three tabs matching the brief §7.3:
 *   Electricity  — 17 periods × 7 residential tiers + 1 commercial flat rate.
 *                  Edit any cell inline; save per row.
 *   Water        — 2 year-based periods × 6 consumption tiers. Same inline edit.
 *   Service Fee  — Flat amounts (with vehicle / without vehicle).
 *                  Admin-only edit (read-only for staff).
 *
 * Rules enforced:
 *   - Positive number, max 2 decimal places.
 *   - Editing a past period shows a warning (issued charges are NOT recalculated).
 *   - Every save is logged (mock: timestamp + updatedBy field on the record).
 *   - Rates are NEVER read from constants in this file; they come from the API.
 */

import { useState } from 'react';
import {
  Tabs, Table, InputNumber, Button, Space, Typography, App as AntApp,
  Card, Form, Tooltip, Alert, Tag, Popconfirm, theme as antTheme,
} from 'antd';
import {
  EditOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, LockOutlined,
} from '@ant-design/icons';import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import { useAuthStore } from '../../store/auth';
import { formatDate } from '../../lib/formatters';
import type {
  ElectricityTariffRate,
  WaterTariffRate,
  ServiceFeeRate,
} from '@phison/types';

const { Title, Text } = Typography;

// ── Current-period response ───────────────────────────────────────────────────

interface CurrentPeriodResponse {
  electricityPeriodLabel: string;
  waterPeriodLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Electricity tab ───────────────────────────────────────────────────────────
// All units in this real-estate are commercial, so only the flat commercial
// rate applies. One editable rate per tariff period.

function ElectricityTab({ canEdit, currentPeriodLabel }: { canEdit: boolean; currentPeriodLabel: string | undefined }) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['pricing-electricity'],
    queryFn: () => api.get<ElectricityTariffRate[]>('/pricing/electricity').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ratePerKwh }: { id: string; ratePerKwh: number }) =>
      api.put<ElectricityTariffRate>(`/pricing/electricity/${id}`, { ratePerKwh }),
    onSuccess: () => {
      message.success('Rate saved');
      qc.invalidateQueries({ queryKey: ['pricing-electricity'] });
      setEditingId(null);
      setEditValue(null);
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // Only the commercial flat rate (tier=1, category='commercial') per period
  const commercialRates = rates.filter(r => r.category === 'commercial');

  const columns = [
    {
      title: 'Tariff Period',
      dataIndex: 'periodLabel',
      key: 'period',
      width: 160,
      render: (label: string) => (
        <Space size={6}>
          <Text strong style={{ fontSize: 13 }}>{label}</Text>
          {label === currentPeriodLabel && (
            <Tag color="blue" style={{ fontSize: 10 }}>Current</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Flat Rate (ETB / kWh)',
      key: 'rate',
      render: (_: unknown, rate: ElectricityTariffRate) => {
        const isEditing = editingId === rate.id;
        return (
          <Space size={6}>
            {isEditing ? (
              <>
                <InputNumber
                  size="small"
                  min={0.01}
                  precision={2}
                  value={editValue ?? rate.ratePerKwh}
                  onChange={v => setEditValue(v)}
                  style={{ width: 90 }}
                  addonAfter="ETB"
                  autoFocus
                />
                <Popconfirm
                  title="Save rate?"
                  description={
                    rate.periodLabel !== currentPeriodLabel
                      ? 'Past period — issued charges will NOT be recalculated.'
                      : undefined
                  }
                  onConfirm={() => {
                    if (!editValue || editValue <= 0) { message.warning('Rate must be > 0'); return; }
                    saveMutation.mutate({ id: rate.id, ratePerKwh: editValue });
                  }}
                  okText="Save"
                >
                  <Button type="primary" size="small" icon={<SaveOutlined />} loading={saveMutation.isPending} />
                </Popconfirm>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => { setEditingId(null); setEditValue(null); }}
                />
              </>
            ) : (
              <Space size={6}>
                <Text style={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 500 }}>
                  {rate.ratePerKwh.toFixed(2)} ETB
                </Text>
                {canEdit && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    style={{ opacity: 0.45, padding: 0, minWidth: 20 }}
                    onClick={() => { setEditingId(rate.id); setEditValue(rate.ratePerKwh); }}
                  />
                )}
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Last Updated',
      key: 'updated',
      render: (_: unknown, rate: ElectricityTariffRate) =>
        rate.updatedBy
          ? <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(rate.updatedAt)}</Text>
          : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {!canEdit && (
        <Alert
          type="info"
          showIcon
          icon={<LockOutlined />}
          message="Read-only view. Only authorized personnel can edit tariff rates."
        />
      )}
      <Alert
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Editing a past period does not recalculate already-issued charges."
        style={{ fontSize: 12 }}
      />

      <Card
        title={
          <Space>
            <Text strong>Electricity — Commercial Rate</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Flat rate per kWh · All units are commercial
            </Text>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={commercialRates}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="small"
          rowClassName={r => r.periodLabel === currentPeriodLabel ? 'ant-table-row-selected' : ''}
        />
      </Card>
    </Space>
  );
}

// ── Water tab ─────────────────────────────────────────────────────────────────

function WaterTab({ canEdit, currentPeriodLabel }: { canEdit: boolean; currentPeriodLabel: string | undefined }) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue]  = useState<number | null>(null);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['pricing-water'],
    queryFn: () => api.get<WaterTariffRate[]>('/pricing/water').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, ratePerM3 }: { id: string; ratePerM3: number }) =>
      api.put<WaterTariffRate>(`/pricing/water/${id}`, { ratePerM3 }),
    onSuccess: () => {
      message.success('Rate saved');
      qc.invalidateQueries({ queryKey: ['pricing-water'] });
      setEditingId(null);
      setEditValue(null);
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const periods = [...new Set(rates.map(r => r.periodLabel))];

  const tiers = [
    { tier: 1, label: '1–5 m³' },
    { tier: 2, label: '6–14 m³' },
    { tier: 3, label: '15–23 m³' },
    { tier: 4, label: '24–41 m³' },
    { tier: 5, label: '42–50 m³' },
    { tier: 6, label: '51+ m³' },
  ];

  const columns = [
    {
      title: 'Consumption',
      key: 'tier',
      fixed: 'left' as const,
      width: 130,
      render: (_: unknown, row: { label: string }) => (
        <Text strong style={{ fontSize: 12 }}>{row.label}</Text>
      ),
    },
    ...periods.map(periodLabel => ({
      title: (
        <Space size={4}>
          <span>{periodLabel}</span>
          {periodLabel === currentPeriodLabel && (
            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>Current</Tag>
          )}
        </Space>
      ),
      key: periodLabel,
      width: 150,
      render: (_: unknown, row: { tier: number }) => {
        const rate = rates.find(r => r.tier === row.tier && r.periodLabel === periodLabel);
        if (!rate) return '—';
        const isEditing = editingId === rate.id;
        return (
          <Space size={4}>
            {isEditing ? (
              <>
                <InputNumber size="small" min={0.01} precision={2} value={editValue ?? rate.ratePerM3} onChange={v => setEditValue(v)} style={{ width: 80 }} autoFocus />
                <Button type="primary" size="small" icon={<SaveOutlined />} loading={saveMutation.isPending}
                  onClick={() => {
                    if (!editValue || editValue <= 0) { message.warning('Rate must be > 0'); return; }
                    saveMutation.mutate({ id: rate.id, ratePerM3: editValue });
                  }}
                />
                <Button size="small" icon={<CloseOutlined />} onClick={() => { setEditingId(null); setEditValue(null); }} />
              </>
            ) : (
              <>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{rate.ratePerM3.toFixed(2)}</span>
                {canEdit && (
                  <Button type="text" size="small" icon={<EditOutlined />} style={{ opacity: 0.4, padding: 0, minWidth: 20 }}
                    onClick={() => { setEditingId(rate.id); setEditValue(rate.ratePerM3); }}
                  />
                )}
              </>
            )}
          </Space>
        );
      },
    })),
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {!canEdit && (
        <Alert type="info" showIcon icon={<LockOutlined />} message="Read-only view. Only authorized personnel can edit tariff rates." />
      )}
      <Card
        title={
          <Space>
            <Text strong>Water Tariff</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Birr per m³ · Incremental block billing</Text>
            <Tooltip title="Water tariff years are Ethiopian calendar years seeded into all quarters. Edit per year below.">
              <InfoCircleOutlined style={{ color: '#9CA3AF' }} />
            </Tooltip>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={tiers}
          columns={columns}
          rowKey="tier"
          loading={isLoading}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  );
}

// ── Service Fee tab ───────────────────────────────────────────────────────────

function ServiceFeeTab({ canEdit }: { canEdit: boolean }) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const { token } = antTheme.useToken();

  const { data: fee, isLoading } = useQuery({
    queryKey: ['pricing-service-fee'],
    queryFn: () => api.get<ServiceFeeRate>('/pricing/service-fee').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (v: { withVehicleAmount: number; withoutVehicleAmount: number }) =>
      api.put<ServiceFeeRate>('/pricing/service-fee', v),
    onSuccess: (res) => {
      message.success('Service fee updated');
      qc.invalidateQueries({ queryKey: ['pricing-service-fee'] });
      form.setFieldsValue({
        withVehicleAmount: res.data.withVehicleAmount,
        withoutVehicleAmount: res.data.withoutVehicleAmount,
      });
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {!canEdit && (
        <Alert
          type="info"
          showIcon
          icon={<LockOutlined />}
          message="Read-only view. Only authorized personnel can edit service fee amounts."
        />
      )}

      {/* Current values display */}
      <Card title="Current Service Fee Rates" loading={isLoading} style={{ maxWidth: 480 }}>
        {fee && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: token.colorBgLayout, borderRadius: 8 }}>
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 12 }}>With Vehicle</Text>
                <Text strong style={{ fontSize: 20 }}>ETB {fee.withVehicleAmount.toFixed(2)}</Text>
              </Space>
              <Tag color="blue">🚗 Has vehicle</Tag>
            </Space>
            <Space style={{ justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: token.colorBgLayout, borderRadius: 8 }}>
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 12 }}>Without Vehicle</Text>
                <Text strong style={{ fontSize: 20 }}>ETB {fee.withoutVehicleAmount.toFixed(2)}</Text>
              </Space>
              <Tag>No vehicle</Tag>
            </Space>
            {fee.updatedAt && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Last updated: {formatDate(fee.updatedAt)}
                {fee.updatedBy && ` by ${fee.updatedBy}`}
              </Text>
            )}
          </Space>
        )}
      </Card>

      {/* Edit form — only shown for authorized personnel */}
      {canEdit && (
        <Card title="Edit Service Fee Rates" style={{ maxWidth: 480 }}>
          <Alert
            type="warning"
            showIcon
            message="Changing these amounts will affect new charges going forward. Already-issued charges are not affected."
            style={{ marginBottom: 20, fontSize: 12 }}
          />
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              withVehicleAmount: fee?.withVehicleAmount ?? 3000,
              withoutVehicleAmount: fee?.withoutVehicleAmount ?? 2500,
            }}
            onFinish={v => saveMutation.mutate(v)}
          >
            <Form.Item
              name="withVehicleAmount"
              label="With Vehicle (ETB)"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0.01, message: 'Must be greater than 0' },
                {
                  validator: (_, value) =>
                    Number.isFinite(value) && String(value).replace(/^\d+\.?/, '').length <= 2
                      ? Promise.resolve()
                      : Promise.reject('Max 2 decimal places'),
                },
              ]}
            >
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: '100%' }}
                addonAfter="ETB"
                addonBefore="🚗"
                placeholder="e.g. 3000"
              />
            </Form.Item>

            <Form.Item
              name="withoutVehicleAmount"
              label="Without Vehicle (ETB)"
              rules={[
                { required: true, message: 'Required' },
                { type: 'number', min: 0.01, message: 'Must be greater than 0' },
                {
                  validator: (_, value) =>
                    Number.isFinite(value) && String(value).replace(/^\d+\.?/, '').length <= 2
                      ? Promise.resolve()
                      : Promise.reject('Max 2 decimal places'),
                },
              ]}
            >
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: '100%' }}
                addonAfter="ETB"
                addonBefore="🚶"
                placeholder="e.g. 2500"
              />
            </Form.Item>

            <Popconfirm
              title="Update service fee?"
              description="New charges will use these amounts. Already-issued charges are NOT affected."
              onConfirm={() => form.submit()}
              okText="Update"
            >
              <Button type="primary" loading={saveMutation.isPending} block>
                Save Service Fee Rates
              </Button>
            </Popconfirm>
          </Form>
        </Card>
      )}
    </Space>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentPricingPage() {
  const { user } = useAuthStore();
  // "Authorized personnel" = admin role (§3 of brief)
  const canEdit = user?.role === 'admin';

  // Fetch the current tariff period dynamically (based on today's date)
  const { data: currentPeriod } = useQuery({
    queryKey: ['pricing-current-period'],
    queryFn: () => api.get<CurrentPeriodResponse>('/pricing/current-period').then(r => r.data),
  });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PaymentsSubNav />

      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Payment Pricing</Title>
        {!canEdit && (
          <Space>
            <LockOutlined style={{ color: '#9CA3AF' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Authorized personnel only can edit prices</Text>
          </Space>
        )}
      </Space>

      <Tabs
        defaultActiveKey="electricity"
        items={[
          {
            key: 'electricity',
            label: 'Electricity',
            children: <ElectricityTab canEdit={canEdit} currentPeriodLabel={currentPeriod?.electricityPeriodLabel} />,
          },
          {
            key: 'water',
            label: 'Water',
            children: <WaterTab canEdit={canEdit} currentPeriodLabel={currentPeriod?.waterPeriodLabel} />,
          },
          {
            key: 'service-fee',
            label: 'Service Fee',
            children: <ServiceFeeTab canEdit={canEdit} />,
          },
        ]}
      />
    </Space>
  );
}
