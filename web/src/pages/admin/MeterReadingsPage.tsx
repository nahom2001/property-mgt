import { useState } from 'react';
import {
  Table, Button, Space, Typography, Modal, Form, Select, InputNumber, App as AntApp,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../lib/api';
import { PaymentType } from '@phison/types';
import type { Unit } from '@phison/types';
import { PaymentsSubNav } from '../../components/shared/SubNav';
import DatePicker from 'antd/es/date-picker/index';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface MeterReading {
  id: string;
  unitId: string;
  type: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  consumption: number;
  unit: string;
}

export default function MeterReadingsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ['meter-readings'],
    queryFn: () => api.get<MeterReading[]>('/payments/meter-readings').then(r => r.data),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get<Unit[]>('/units').then(r => r.data),
    select: u => u.filter(x => x.status === 'active'),
  });

  const createMutation = useMutation({
    mutationFn: (v: Record<string, unknown>) => api.post('/payments/meter-readings', v),
    onSuccess: () => {
      message.success('Reading recorded');
      qc.invalidateQueries({ queryKey: ['meter-readings'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const columns = [
    {
      title: 'Unit', dataIndex: 'unitId', key: 'unitId',
      render: (unitId: string) => units.find(u => u.id === unitId)?.identifier ?? unitId,
    },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => t.replace(/_/g, ' ') },
    { title: 'Consumption', key: 'consumption', render: (_: unknown, r: MeterReading) => `${r.consumption} ${r.unit}` },
    { title: 'Period', key: 'period', render: (_: unknown, r: MeterReading) => dayjs(r.billingPeriodStart).format('MMM YYYY') },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PaymentsSubNav />
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Meter Readings</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add Reading</Button>
      </Space>

      <Table dataSource={readings} columns={columns} rowKey="id" loading={isLoading} />

      <Modal
        title="Record Meter Reading"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={v => createMutation.mutate({
            ...v,
            billingPeriodStart: dayjs(v.period[0]).startOf('month').toISOString(),
            billingPeriodEnd: dayjs(v.period[1]).endOf('month').toISOString(),
          })}
        >
          <Form.Item name="unitId" label="Unit" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={units.map(u => ({ label: u.identifier, value: u.id }))} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Electricity (kWh)', value: PaymentType.ElectricityFee },
              { label: 'Water (m³)', value: PaymentType.WaterPayment },
            ]} />
          </Form.Item>
          <Form.Item name="period" label="Billing Period" rules={[{ required: true }]}>
            <RangePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="consumption" label="Consumption" rules={[{ required: true }]}>
            <InputNumber min={0} precision={3} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
