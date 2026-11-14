// import {
//   Card, Form, InputNumber, Button, Space, Typography, App as AntApp, Select,
// } from 'antd';
// import { FieldTimeOutlined } from '@ant-design/icons';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { api, getErrorMessage } from '../../lib/api';
// import { PaymentType } from '@phison/types';
//
// const { Title } = Typography;
//
// export default function SettingsPage() {
//   const { message } = AntApp.useApp();
//   const qc = useQueryClient();
//   const [form] = Form.useForm();
//
//   const { data: configs = [] } = useQuery({
//     queryKey: ['late-fee-configs'],
//     queryFn: () =>
//       api
//         .get<Array<{ paymentType: string; amount: number }>>('/payments/late-fee-config')
//         .then(r => r.data),
//   });
//
//   const mutation = useMutation({
//     mutationFn: (v: { paymentType: string; amount: number }) =>
//       api.post('/payments/late-fee-config', { ...v, amount: Math.round(v.amount * 100) }),
//     onSuccess: () => {
//       message.success('Late fee saved');
//       qc.invalidateQueries({ queryKey: ['late-fee-configs'] });
//       form.resetFields();
//     },
//     onError: (e) => message.error(getErrorMessage(e)),
//   });
//
//   return (
//     <Space direction="vertical" size={24} style={{ width: '100%' }}>
//       <Title level={4} style={{ margin: 0 }}>
//         <Space size={8}>
//           <FieldTimeOutlined />
//           Settings
//         </Space>
//       </Title>
//
//       <Card title="Late Fee Configuration" style={{ maxWidth: 500 }}>
//         <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
//           {configs.map(c => (
//             <Space
//               key={c.paymentType}
//               style={{ justifyContent: 'space-between', width: '100%' }}
//             >
//               <Typography.Text>{c.paymentType.replace(/_/g, ' ')}</Typography.Text>
//               <Typography.Text strong>{(c.amount / 100).toFixed(2)} ETB</Typography.Text>
//             </Space>
//           ))}
//         </Space>
//
//         <Form form={form} layout="vertical" onFinish={v => mutation.mutate(v)}>
//           <Form.Item name="paymentType" label="Payment Type" rules={[{ required: true }]}>
//             <Select
//               options={Object.values(PaymentType).map(t => ({
//                 label: t.replace(/_/g, ' '),
//                 value: t,
//               }))}
//             />
//           </Form.Item>
//           <Form.Item name="amount" label="Flat Late Fee (ETB)" rules={[{ required: true }]}>
//             <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="ETB" />
//           </Form.Item>
//           <Button type="primary" htmlType="submit" loading={mutation.isPending}>
//             Save
//           </Button>
//         </Form>
//       </Card>
//     </Space>
//   );
// }
