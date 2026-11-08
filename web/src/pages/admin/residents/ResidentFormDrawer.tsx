/**
 * ResidentFormDrawer
 *
 * Drawer-based form for registering a new resident or editing an existing one.
 * Pattern: same Drawer + Form approach used by RequestsAdminPage (status form).
 *
 * On create:
 *   1. POST /users        — creates user account (role=resident)
 *   2. POST /units/links  — links that user to a unit with the chosen role/date
 *
 * On edit:
 *   1. PATCH /residents/:id — updates fullName, phone, email, status, language
 *      (unit-link changes are handled separately via the detail page)
 */

import {
  Drawer, Form, Input, Select, Button, Space, Typography, App as AntApp, DatePicker, Divider,
} from 'antd';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { UserStatus, ResidentRole } from '@phison/types';
import type { User, Unit } from '@phison/types';
import type { RegisterResidentRequest, UpdateResidentRequest } from '@phison/types';
import { api, getErrorMessage } from '../../../lib/api';

const { Text } = Typography;

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateValues {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  residentRole: ResidentRole;
  unitId: string;
  startDate: dayjs.Dayjs;
  status: UserStatus;
  preferredLanguage: 'am' | 'en';
  hasVehicle: boolean;
  vehicleNumber?: string;
}

interface EditValues {
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  preferredLanguage: 'am' | 'en';
  hasVehicle: boolean;
  vehicleNumber?: string;
}

export interface ResidentFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Pass resident to edit; omit for create */
  resident?: User;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResidentFormDrawer({ open, onClose, resident }: ResidentFormDrawerProps) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm<CreateValues | EditValues>();
  const isEdit = resident !== undefined;

  // ── Units for the unit selector (create mode only) ─────────────────────────
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.get<Unit[]>('/units').then(r => r.data),
    select: (u) => u.filter(x => x.status === 'active'),
    enabled: !isEdit,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (v: CreateValues) => {
      const createPayload: RegisterResidentRequest = {
        fullName: v.fullName,
        email: v.email,
        password: v.password,
        phone: v.phone,
        residentRole: v.residentRole,
        unitId: v.unitId,
        startDate: v.startDate.toISOString(),
        status: v.status,
        preferredLanguage: v.preferredLanguage,
        hasVehicle: v.hasVehicle,
        vehicleNumber: v.vehicleNumber,
      };
      const userRes = await api.post<User>('/residents', createPayload);
      const userId = userRes.data.id;

      // Step 2: link the user to the unit
      await api.post('/units/links', {
        userId,
        unitId: v.unitId,
        role: v.residentRole,
        startDate: v.startDate.toISOString(),
      });

      return userRes.data;
    },
    onSuccess: () => {
      message.success('Resident registered');
      qc.invalidateQueries({ queryKey: ['residents'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      form.resetFields();
      onClose();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  const editMutation = useMutation({
    mutationFn: (v: EditValues) => {
      const payload: UpdateResidentRequest = {
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        status: v.status,
        preferredLanguage: v.preferredLanguage,
      };
      return api.patch(`/residents/${resident!.id}`, payload);
    },
    onSuccess: () => {
      message.success('Resident updated');
      qc.invalidateQueries({ queryKey: ['residents'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function handleClose() {
    form.resetFields();
    onClose();
  }

  function handleFinish(values: CreateValues | EditValues) {
    if (isEdit) {
      editMutation.mutate(values as EditValues);
    } else {
      createMutation.mutate(values as CreateValues);
    }
  }

  const isPending = createMutation.isPending || editMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Drawer
      title={isEdit ? 'Edit Resident' : 'Register Resident'}
      open={open}
      onClose={handleClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={isPending}>
            {isEdit ? 'Save changes' : 'Register'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={
          isEdit
            ? {
                fullName: resident.fullName,
                email: resident.email,
                phone: resident.phone ?? '',
                status: resident.status,
                preferredLanguage: resident.preferredLanguage,
              }
            : {
                status: UserStatus.Active,
                preferredLanguage: 'en',
                residentRole: ResidentRole.Tenant,
              }
        }
      >
        {/* ── Personal details ─────────────────────────────────────── */}
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Personal details
        </Text>

        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: 'Full name is required' },
            { min: 2, message: 'At least 2 characters' },
          ]}
        >
          <Input placeholder="e.g. Abebe Girma" autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: 'Phone number is required' },
            {
              pattern: /^[+]?[\d\s\-()]{7,20}$/,
              message: 'Enter a valid phone number',
            },
          ]}
        >
          <Input placeholder="+251 91 234 5678" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email address' },
          ]}
        >
          <Input placeholder="abebe@email.com" autoComplete="off" />
        </Form.Item>

        {/* ── Account settings ─────────────────────────────────────── */}
        <Divider style={{ margin: '16px 0' }} />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Account settings
        </Text>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Initial Password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'At least 8 characters' },
            ]}
          >
            <Input.Password placeholder="Min. 8 characters" autoComplete="new-password" />
          </Form.Item>
        )}

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Active', value: UserStatus.Active },
              { label: 'Suspended', value: UserStatus.Suspended },
            ]}
          />
        </Form.Item>

        <Form.Item name="preferredLanguage" label="Preferred Language">
          <Select
            options={[
              { label: 'English', value: 'en' },
              { label: 'Amharic (አማርኛ)', value: 'am' },
            ]}
          />
        </Form.Item>

        {/* ── Unit link (create only) ──────────────────────────────── */}
        {!isEdit && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              Unit assignment
            </Text>

            <Form.Item
              name="residentRole"
              label="Resident Type"
              rules={[{ required: true, message: 'Select tenant or owner' }]}
            >
              <Select
                options={[
                  { label: 'Tenant', value: ResidentRole.Tenant },
                  { label: 'Owner', value: ResidentRole.Owner },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="unitId"
              label="Unit"
              rules={[{ required: true, message: 'Assign a unit' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Search by unit identifier…"
                options={units.map(u => ({
                  label: `${u.identifier}${u.floor ? ` · Floor ${u.floor}` : ''}${u.area ? ` · ${u.area} m²` : ''}`,
                  value: u.id,
                }))}
                notFoundContent="No active units found"
              />
            </Form.Item>

            <Form.Item
              name="startDate"
              label="Move-in / Start Date"
              rules={[{ required: true, message: 'Start date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
}
