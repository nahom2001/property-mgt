/**
 * Mock API — returns realistic data so the frontend is fully explorable
 * without a running backend or database.
 *
 * Activated when VITE_USE_MOCK=true (set in .env.local).
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  UserRole, ChargeStatus, PaymentType, RequestStatus,
  NoticeCategory, NoticeAudienceType, VoucherDirection,
} from '@phison/types';

// ── Seed data ────────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'user-admin-1', fullName: 'Abebe Girma', email: 'admin@phison.local', phone: '+251 91 100 0001', role: UserRole.Admin, status: 'active', preferredLanguage: 'en', hasVehicle: null as boolean | null, vehicleNumber: null as string | null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' };
const STAFF_USER = { id: 'user-staff-1', fullName: 'Tigist Haile', email: 'staff@phison.local', phone: '+251 91 100 0002', role: UserRole.Staff, status: 'active', preferredLanguage: 'am', hasVehicle: null, vehicleNumber: null, createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-01-15T08:00:00Z' };
const RESIDENT_USER = { id: 'user-resident-1', fullName: 'Dawit Bekele', email: 'resident@phison.local', phone: '+251 91 234 5678', role: UserRole.Resident, status: 'active', preferredLanguage: 'en', hasVehicle: true, vehicleNumber: 'AA-12345', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-01T08:00:00Z' };

const USERS: typeof ADMIN_USER[] = [
  ADMIN_USER, STAFF_USER, RESIDENT_USER,
  { id: 'user-resident-2', fullName: 'Hiwot Tadesse', email: 'hiwot@phison.local', phone: '+251 91 234 5679', role: UserRole.Resident, status: 'active', preferredLanguage: 'am', hasVehicle: false, vehicleNumber: null, createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-10T08:00:00Z' },
  { id: 'user-resident-3', fullName: 'Yonas Mekonnen', email: 'yonas@phison.local', phone: '+251 91 234 5680', role: UserRole.Resident, status: 'suspended', preferredLanguage: 'en', hasVehicle: false, vehicleNumber: null, createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
];

const UNITS = [
  { id: 'unit-1', identifier: 'Apt 1A', type: 'apartment', area: 75.5, floor: '1', notes: null, status: 'active', blockId: null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'unit-2', identifier: 'Apt 1B', type: 'apartment', area: 68.0, floor: '1', notes: null, status: 'active', blockId: null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'unit-3', identifier: 'Apt 2A', type: 'apartment', area: 82.0, floor: '2', notes: 'Corner unit', status: 'active', blockId: null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'unit-4', identifier: 'Apt 2B', type: 'apartment', area: 68.0, floor: '2', notes: null, status: 'inactive', blockId: null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'unit-5', identifier: 'Shop G1', type: 'other', area: 45.0, floor: 'G', notes: 'Ground floor commercial', status: 'active', blockId: null, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
];

const PROVIDER_PAYMENTS: Array<Record<string, unknown>> = [
  { id: 'pp-1', type: PaymentType.ElectricityFee, provider: 'EEU', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', amount: 1250000, currency: 'ETB', paidOn: '2026-10-05T08:00:00Z', reference: 'EEU-SEP-2026', recordedBy: 'user-admin-1', status: 'allocated', attachmentFilename: null, attachmentMimeType: null, attachmentData: null, createdAt: '2026-10-05T08:00:00Z' },
  { id: 'pp-2', type: PaymentType.WaterPayment, provider: 'AAWSA', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', amount: 480000, currency: 'ETB', paidOn: '2026-10-06T08:00:00Z', reference: 'AAWSA-SEP-2026', recordedBy: 'user-admin-1', status: 'allocated', attachmentFilename: null, attachmentMimeType: null, attachmentData: null, createdAt: '2026-10-06T08:00:00Z' },
  { id: 'pp-3', type: PaymentType.ServiceFee, provider: 'Phison Services', billingPeriodStart: '2026-10-01T00:00:00Z', billingPeriodEnd: '2026-10-31T00:00:00Z', amount: 750000, currency: 'ETB', paidOn: '2026-11-01T08:00:00Z', reference: 'SVC-OCT-2026', recordedBy: 'user-admin-1', status: 'unallocated', attachmentFilename: null, attachmentMimeType: null, attachmentData: null, createdAt: '2026-11-01T08:00:00Z' },
];

// ── Meter readings (consumption per unit per billing period) ──────────────────
// Used by rate-based allocation calculation.

const METER_READINGS = [
  // Electricity — Sep 2026 billing period
  { id: 'mr-1', unitId: 'unit-1', type: 'electricity_fee', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 450, unit: 'kWh' },
  { id: 'mr-2', unitId: 'unit-2', type: 'electricity_fee', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 380, unit: 'kWh' },
  { id: 'mr-3', unitId: 'unit-3', type: 'electricity_fee', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 520, unit: 'kWh' },
  { id: 'mr-4', unitId: 'unit-5', type: 'electricity_fee', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 450, unit: 'kWh' },
  // Water — Sep 2026 billing period
  { id: 'mr-5', unitId: 'unit-1', type: 'water_payment', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 32, unit: 'm3' },
  { id: 'mr-6', unitId: 'unit-2', type: 'water_payment', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 22, unit: 'm3' },
  { id: 'mr-7', unitId: 'unit-3', type: 'water_payment', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 38, unit: 'm3' },
  { id: 'mr-8', unitId: 'unit-5', type: 'water_payment', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', consumption: 12, unit: 'm3' },
];

// ── Resident-unit links (occupancy) ───────────────────────────────────────────

const RESIDENT_LINKS = [
  { id: 'link-1', userId: 'user-resident-1', unitId: 'unit-1', role: 'tenant', startDate: '2026-02-01T00:00:00Z', endDate: null, createdBy: 'user-admin-1', createdAt: '2026-02-01T08:00:00Z' },
  { id: 'link-2', userId: 'user-resident-2', unitId: 'unit-2', role: 'tenant', startDate: '2026-02-10T00:00:00Z', endDate: null, createdBy: 'user-admin-1', createdAt: '2026-02-10T08:00:00Z' },
  { id: 'link-3', userId: 'user-resident-3', unitId: 'unit-3', role: 'owner', startDate: '2026-03-01T00:00:00Z', endDate: null, createdBy: 'user-admin-1', createdAt: '2026-03-01T08:00:00Z' },
];

const CHARGES = [
  { id: 'charge-1', allocationId: 'alloc-1', unitId: 'unit-1', payerId: 'user-resident-1', payerRole: 'tenant', amount: 250000, paidAmount: 250000, currency: 'ETB', dueDate: '2026-10-31T00:00:00Z', status: ChargeStatus.Paid, createdAt: '2026-10-08T08:00:00Z', updatedAt: '2026-10-15T08:00:00Z' },
  { id: 'charge-2', allocationId: 'alloc-1', unitId: 'unit-2', payerId: 'user-resident-2', payerRole: 'tenant', amount: 237500, paidAmount: 100000, currency: 'ETB', dueDate: '2026-10-31T00:00:00Z', status: ChargeStatus.PartiallyPaid, createdAt: '2026-10-08T08:00:00Z', updatedAt: '2026-10-20T08:00:00Z' },
  { id: 'charge-3', allocationId: 'alloc-1', unitId: 'unit-3', payerId: 'user-resident-3', payerRole: 'owner', amount: 262500, paidAmount: 0, currency: 'ETB', dueDate: '2026-10-31T00:00:00Z', status: ChargeStatus.Overdue, createdAt: '2026-10-08T08:00:00Z', updatedAt: '2026-11-01T08:00:00Z' },
  { id: 'charge-4', allocationId: 'alloc-2', unitId: 'unit-1', payerId: 'user-resident-1', payerRole: 'tenant', amount: 96000, paidAmount: 0, currency: 'ETB', dueDate: '2026-11-15T00:00:00Z', status: ChargeStatus.Issued, createdAt: '2026-10-10T08:00:00Z', updatedAt: '2026-10-10T08:00:00Z' },
];

const VOUCHERS = [
  { id: 'v-1', voucherNumber: '000001', direction: VoucherDirection.Outgoing, paymentType: PaymentType.ElectricityFee, unitId: null, payerId: null, payerRole: null, chargeId: null, providerPaymentId: 'pp-1', residentPaymentId: null, amount: 1250000, currency: 'ETB', paymentDate: '2026-10-05T08:00:00Z', reference: 'EEU-SEP-2026', issuedBy: 'user-admin-1', status: 'issued', createdAt: '2026-10-05T08:00:00Z' },
  { id: 'v-2', voucherNumber: '000002', direction: VoucherDirection.Incoming, paymentType: PaymentType.ElectricityFee, unitId: 'unit-1', payerId: 'user-resident-1', payerRole: 'tenant', chargeId: 'charge-1', providerPaymentId: null, residentPaymentId: 'rp-1', amount: 250000, currency: 'ETB', paymentDate: '2026-10-15T08:00:00Z', reference: 'CBE-TRF-001', issuedBy: 'user-admin-1', status: 'issued', createdAt: '2026-10-15T08:00:00Z' },
  { id: 'v-3', voucherNumber: '000003', direction: VoucherDirection.Outgoing, paymentType: PaymentType.WaterPayment, unitId: null, payerId: null, payerRole: null, chargeId: null, providerPaymentId: 'pp-2', residentPaymentId: null, amount: 480000, currency: 'ETB', paymentDate: '2026-10-06T08:00:00Z', reference: 'AAWSA-SEP-2026', issuedBy: 'user-admin-1', status: 'issued', createdAt: '2026-10-06T08:00:00Z' },
];

const NOTICES = [
  { id: 'n-1', title: 'October Electricity Bill Issued', body: 'Your electricity charge for September has been issued. Please pay by October 31.', category: NoticeCategory.Payment, audienceType: NoticeAudienceType.All, audienceFilter: [], authorId: 'user-admin-1', isSystemGenerated: true, status: 'active', publishedAt: '2026-10-08T09:00:00Z', retractedAt: null, retractedBy: null, createdAt: '2026-10-08T09:00:00Z' },
  { id: 'n-2', title: 'Scheduled Power Maintenance', body: 'There will be a scheduled power outage on November 10, 2026 from 9:00 AM to 12:00 PM for maintenance work.', category: NoticeCategory.Outage, audienceType: NoticeAudienceType.All, audienceFilter: [], authorId: 'user-admin-1', isSystemGenerated: false, status: 'active', publishedAt: '2026-11-04T10:00:00Z', retractedAt: null, retractedBy: null, createdAt: '2026-11-04T10:00:00Z' },
  { id: 'n-3', title: 'Overdue Payment Reminder', body: 'Your electricity charge of ETB 2,625.00 is now overdue. Please pay immediately to avoid penalties.', category: NoticeCategory.Payment, audienceType: NoticeAudienceType.Individuals, audienceFilter: ['user-resident-1'], authorId: 'user-admin-1', isSystemGenerated: true, status: 'active', publishedAt: '2026-11-01T08:00:00Z', retractedAt: null, retractedBy: null, createdAt: '2026-11-01T08:00:00Z' },
  { id: 'n-4', title: 'Common Area Cleaning Schedule', body: 'Common areas will be cleaned every Monday and Thursday from 7:00 AM to 9:00 AM.', category: NoticeCategory.General, audienceType: NoticeAudienceType.All, audienceFilter: [], authorId: 'user-admin-1', isSystemGenerated: false, status: 'active', publishedAt: '2026-10-01T08:00:00Z', retractedAt: null, retractedBy: null, createdAt: '2026-10-01T08:00:00Z' },
];

const REQUESTS = [
  {
    id: 'req-1', unitId: 'unit-1', residentId: 'user-resident-1', category: 'maintenance',
    subject: 'Leaking tap in bathroom', description: 'The tap in the main bathroom has been leaking for 3 days.',
    status: RequestStatus.InProgress, assignedTo: 'user-staff-1',
    createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-22T14:00:00Z',
    history: [
      { id: 'h-1', toStatus: 'submitted', fromStatus: null, actorId: 'user-resident-1', comment: null, timestamp: '2026-10-20T10:00:00Z' },
      { id: 'h-2', toStatus: 'acknowledged', fromStatus: 'submitted', actorId: 'user-staff-1', comment: 'We will send a plumber.', timestamp: '2026-10-21T09:00:00Z' },
      { id: 'h-3', toStatus: 'in_progress', fromStatus: 'acknowledged', actorId: 'user-staff-1', comment: 'Plumber visited, parts ordered.', timestamp: '2026-10-22T14:00:00Z' },
    ],
    comments: [
      { id: 'c-1', requestId: 'req-1', authorId: 'user-staff-1', body: 'We will send a plumber within 24 hours.', visibility: 'public', createdAt: '2026-10-21T09:00:00Z' },
    ],
  },
  {
    id: 'req-2', unitId: 'unit-1', residentId: 'user-resident-1', category: 'query',
    subject: 'Parking space allocation', description: 'I would like to know if a parking space is available.',
    status: RequestStatus.Submitted, assignedTo: null,
    createdAt: '2026-11-03T11:00:00Z', updatedAt: '2026-11-03T11:00:00Z',
    history: [{ id: 'h-4', toStatus: 'submitted', fromStatus: null, actorId: 'user-resident-1', comment: null, timestamp: '2026-11-03T11:00:00Z' }],
    comments: [],
  },
];

const LEDGER = [
  { id: 'pp-1', type: 'electricity_fee', provider: 'EEU', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', amount: 1250000, recovered: 350000, outstanding: 900000, status: 'allocated', currency: 'ETB' },
  { id: 'pp-2', type: 'water_payment', provider: 'AAWSA', billingPeriodStart: '2026-09-01T00:00:00Z', billingPeriodEnd: '2026-09-30T00:00:00Z', amount: 480000, recovered: 480000, outstanding: 0, status: 'allocated', currency: 'ETB' },
];

const PENDING_PAYMENTS: Array<Record<string, unknown>> = [
  { id: 'rp-pending-1', chargeId: 'charge-2', amount: 137500, transactionFee: 2750, method: 'online', status: 'pending_confirmation', paidOn: '2026-11-05T14:30:00Z', reference: 'CBE-ONLINE-9921', recordedBy: 'user-resident-2', attachmentFilename: 'payment-proof.jpg', attachmentMimeType: 'image/jpeg', attachmentData: null },
];

const LATE_FEE_CONFIGS = [
  { id: 'lfc-1', paymentType: 'service_fee', amount: 20000, currency: 'ETB', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lfc-2', paymentType: 'electricity_fee', amount: 30000, currency: 'ETB', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lfc-3', paymentType: 'water_payment', amount: 15000, currency: 'ETB', updatedAt: '2026-01-01T00:00:00Z' },
];

// ── Tariff seed data ──────────────────────────────────────────────────────────

// Service fee (ETB, not santim)
let SERVICE_FEE: { id: string; withVehicleAmount: number; withoutVehicleAmount: number; effectiveFrom: string; updatedBy: string | null; updatedAt: string } = { id: 'sf-1', withVehicleAmount: 3000, withoutVehicleAmount: 2500, effectiveFrom: '2024-07-01T00:00:00Z', updatedBy: null, updatedAt: '2024-07-01T00:00:00Z' };

// Electricity tariff periods and rates (ETB per kWh)
// Source: §11.3 of brief. All 7 residential tiers + 1 commercial flat.
const ELEC_TIER_LABELS = [
  { tier: 1, fromKwh: 0,   toKwh: 50,  label: '0–50 kWh' },
  { tier: 2, fromKwh: 51,  toKwh: 100, label: '51–100 kWh' },
  { tier: 3, fromKwh: 101, toKwh: 200, label: '101–200 kWh' },
  { tier: 4, fromKwh: 201, toKwh: 300, label: '201–300 kWh' },
  { tier: 5, fromKwh: 301, toKwh: 400, label: '301–400 kWh' },
  { tier: 6, fromKwh: 401, toKwh: 500, label: '401–500 kWh' },
  { tier: 7, fromKwh: 501, toKwh: null, label: '>500 kWh' },
];

// [period label, [t1,t2,t3,t4,t5,t6,t7, commercial]]
const ELEC_RATE_DATA: Array<[string, number[]]> = [
  ['Pre-2024/25', [0.27, 0.77, 1.63, 2.00, 2.20, 2.41, 2.48, 2.12]],
  ['2024/25 Q1',  [0.35, 0.95, 1.89, 2.46, 2.66, 2.85, 2.92, 2.61]],
  ['2024/25 Q2',  [0.43, 1.13, 2.15, 2.92, 3.12, 3.29, 3.35, 3.09]],
  ['2024/25 Q3',  [0.52, 1.31, 2.41, 3.38, 3.57, 3.73, 3.79, 3.57]],
  ['2024/25 Q4',  [0.60, 1.49, 2.67, 3.84, 4.03, 4.17, 4.23, 4.05]],
  ['2025/26 Q1',  [0.68, 1.67, 2.93, 4.30, 4.49, 4.62, 4.66, 4.53]],
  ['2025/26 Q2',  [0.76, 1.85, 3.19, 4.76, 4.95, 5.06, 5.10, 5.01]],
  ['2025/26 Q3',  [0.84, 2.03, 3.45, 5.22, 5.41, 5.50, 5.54, 5.50]],
  ['2025/26 Q4',  [0.92, 2.21, 3.72, 5.68, 5.86, 5.94, 5.97, 5.98]],
  ['2026/27 Q1',  [1.00, 2.39, 3.98, 6.14, 6.32, 6.39, 6.41, 6.46]],
  ['2026/27 Q2',  [1.08, 2.57, 4.24, 6.60, 6.78, 6.83, 6.84, 6.94]],
  ['2026/27 Q3',  [1.16, 2.76, 4.50, 7.06, 7.24, 7.27, 7.28, 7.42]],
  ['2026/27 Q4',  [1.24, 2.94, 4.76, 7.52, 7.70, 7.71, 7.72, 7.90]],
  ['2027/28 Q1',  [1.32, 3.12, 5.02, 7.98, 8.15, 8.16, 8.15, 8.39]],
  ['2027/28 Q2',  [1.40, 3.30, 5.28, 8.44, 8.61, 8.60, 8.59, 8.87]],
  ['2027/28 Q3',  [1.48, 3.48, 5.55, 8.89, 9.07, 9.04, 9.03, 9.35]],
  ['2027/28 Q4',  [1.56, 3.66, 5.81, 9.35, 9.53, 9.48, 9.46, 9.83]],
];

// Build a flat list of electricity rates
const ELECTRICITY_RATES: Array<{
  id: string; periodId: string; periodLabel: string; category: string;
  tier: number; fromKwh: number; toKwh: number | null; ratePerKwh: number;
  updatedBy: string | null; updatedAt: string;
}> = [];

ELEC_RATE_DATA.forEach(([label, rates], pi) => {
  const periodId = `ep-${pi}`;
  ELEC_TIER_LABELS.forEach(({ tier, fromKwh, toKwh }, ti) => {
    ELECTRICITY_RATES.push({
      id: `er-${pi}-${ti}`,
      periodId,
      periodLabel: label,
      category: 'residential',
      tier,
      fromKwh,
      toKwh,
      ratePerKwh: rates[ti],
      updatedBy: null,
      updatedAt: '2024-07-01T00:00:00Z',
    });
  });
  // commercial flat rate (tier 8)
  ELECTRICITY_RATES.push({
    id: `er-${pi}-7`,
    periodId,
    periodLabel: label,
    category: 'commercial',
    tier: 1,
    fromKwh: 0,
    toKwh: null,
    ratePerKwh: rates[7],
    updatedBy: null,
    updatedAt: '2024-07-01T00:00:00Z',
  });
});

// Water tariff — Birr per m³ (§11.4 of brief)
const WATER_TIER_LABELS = [
  { tier: 1, fromM3: 1,  toM3: 5,    label: '1–5 m³' },
  { tier: 2, fromM3: 6,  toM3: 14,   label: '6–14 m³' },
  { tier: 3, fromM3: 15, toM3: 23,   label: '15–23 m³' },
  { tier: 4, fromM3: 24, toM3: 41,   label: '24–41 m³' },
  { tier: 5, fromM3: 42, toM3: 50,   label: '42–50 m³' },
  { tier: 6, fromM3: 51, toM3: null, label: '51+ m³' },
];

const WATER_RATE_DATA: Array<[string, number[]]> = [
  ['2018', [13.92, 24.37, 45.25, 69.62, 83.54, 111.39]],
  ['2019', [17.18, 30.06, 55.82, 85.88, 103.05, 137.04]],
];

const WATER_RATES: Array<{
  id: string; periodId: string; periodLabel: string;
  tier: number; fromM3: number; toM3: number | null; ratePerM3: number;
  updatedBy: string | null; updatedAt: string;
}> = [];

WATER_RATE_DATA.forEach(([label, rates], pi) => {
  const periodId = `wp-${pi}`;
  WATER_TIER_LABELS.forEach(({ tier, fromM3, toM3 }, ti) => {
    WATER_RATES.push({
      id: `wr-${pi}-${ti}`,
      periodId,
      periodLabel: label,
      tier,
      fromM3,
      toM3,
      ratePerM3: rates[ti],
      updatedBy: null,
      updatedAt: '2024-07-01T00:00:00Z',
    });
  });
});

// ── Current-period detection ──────────────────────────────────────────────────
// Ethiopian fiscal year starts July 8. Quarters:
//   Q1: Jul 8 – Oct 7,  Q2: Oct 8 – Jan 7,  Q3: Jan 8 – Apr 7,  Q4: Apr 8 – Jul 7
// Ethiopian calendar New Year (for water tariff years) is Sept 11.

function getCurrentElecPeriodLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-indexed
  const d = now.getDate();
  const isAfterFyStart = m > 7 || (m === 7 && d >= 8);
  const fyStart = isAfterFyStart ? y : y - 1;
  const fyLabel = `${fyStart}/${String(fyStart + 1).slice(-2)}`;

  let quarter: number;
  if (isAfterFyStart) {
    quarter = (m <= 9 || (m === 10 && d <= 7)) ? 1 : 2;
  } else {
    quarter = (m === 1 && d <= 7) ? 2
      : ((m === 1 && d >= 8) || m <= 3 || (m === 4 && d <= 7)) ? 3
      : 4;
  }
  return `${fyLabel} Q${quarter}`;
}

function getCurrentWaterPeriodLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const isAfterNewYear = m > 9 || (m === 9 && d >= 11);
  return String(isAfterNewYear ? y - 7 : y - 8);
}

// ── Rate-based allocation helpers ─────────────────────────────────────────────

// ── Router ────────────────────────────────────────────────────────────────────

type MockResponse = { data: unknown; status: number };
type Handler = (url: string, body: unknown, params: Record<string, string>) => MockResponse;

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

function on(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method, pattern, handler });
}

function ok(data: unknown): MockResponse { return { data, status: 200 }; }
function noContent(): MockResponse { return { data: {}, status: 204 }; }
function err(status: number, message: string): MockResponse { return { data: { statusCode: status, message }, status }; }

// Auth
on('POST', /\/auth\/login$/, (_url, body) => {
  const { email, password } = body as { email: string; password: string };
  const user = USERS.find(u => u.email === email);
  if (!user || (password?.length ?? 0) < 8) return err(401, 'Invalid credentials');
  return ok({ accessToken: `mock-token-${user.id}`, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
});

// Users
on('GET', /\/users$/, () => ok(USERS));
on('GET', /\/users\/[\w-]+$/, (url) => ok(USERS.find(u => u.id === url.split('/').pop()) ?? USERS[0]));
on('POST', /\/users$/, (_url, body) => {
  const u = { id: `user-${Date.now()}`, ...(body as object), status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  USERS.push(u as typeof ADMIN_USER);
  return ok(u);
});
on('PATCH', /\/users\/[\w-]+\/suspend/, (url) => { const u = USERS.find(x => x.id === url.split('/')[2]); if (u) u.status = 'suspended'; return noContent(); });
on('PATCH', /\/users\/[\w-]+\/reactivate/, (url) => { const u = USERS.find(x => x.id === url.split('/')[2]); if (u) u.status = 'active'; return noContent(); });
on('PATCH', /\/users\/[\w-]+\/role/, () => noContent());

// Residents — dedicated routes used by ResidentsPage, ResidentDetailPage
// POST /residents  — register (creates user with role=resident + unit link in one call)
// GET  /residents  — list all users (all roles)
// GET  /residents/:id — get single user
// PATCH /residents/:id — edit resident fields
on('GET', /\/residents$/, () => ok(USERS));
on('GET', /\/residents\/[\w-]+$/, (url) => {
  const id = url.split('/').pop()!;
  return ok(USERS.find(u => u.id === id) ?? USERS[0]);
});
on('POST', /\/residents$/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const u = {
    id: `user-${Date.now()}`,
    fullName: b.fullName as string,
    email: b.email as string,
    phone: b.phone as string ?? null,
    role: UserRole.Resident,
    status: (b.status as string) ?? 'active',
    preferredLanguage: (b.preferredLanguage as string) ?? 'en',
    hasVehicle: b.hasVehicle ?? false,
    vehicleNumber: b.vehicleNumber ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  USERS.push(u as typeof ADMIN_USER);
  return ok(u);
});
on('PATCH', /\/residents\/[\w-]+$/, (url, body) => {
  const id = url.split('/').pop()!;
  const u = USERS.find(x => x.id === id);
  if (u) Object.assign(u, body as object, { updatedAt: new Date().toISOString() });
  return ok(u ?? {});
});

// Units
on('GET', /\/units\/links\/search/, (url) => {
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const userId = params.get('userId');
  const unitId = params.get('unitId');
  let results = RESIDENT_LINKS;
  if (userId) results = results.filter(l => l.userId === userId);
  if (unitId) results = results.filter(l => l.unitId === unitId);
  return ok(results);
});
on('GET', /\/units$/, () => ok(UNITS));
on('GET', /\/units\/[\w-]+$/, (url) => ok(UNITS.find(u => u.id === url.split('/').pop()) ?? UNITS[0]));
on('POST', /\/units$/, (_url, body) => { const u = { id: `unit-${Date.now()}`, ...(body as object), status: 'active', blockId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; UNITS.push(u as typeof UNITS[0]); return ok(u); });
on('POST', /\/units\/links$/, () => ok({ id: `link-${Date.now()}` }));
on('PATCH', /\/units\/[\w-]+\/deactivate/, () => noContent());
on('PATCH', /\/units\/[\w-]+\/activate/, () => noContent());
on('PATCH', /\/units\/links\/[\w-]+\/close/, () => noContent());

// Provider payments
on('GET', /\/payments\/provider/, () => ok(PROVIDER_PAYMENTS));
on('POST', /\/payments\/provider/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const p = {
    id: `pp-${Date.now()}`,
    type: b.type,
    provider: b.provider,
    billingPeriodStart: b.billingPeriodStart,
    billingPeriodEnd: b.billingPeriodEnd,
    amount: b.amount,
    currency: 'ETB',
    paidOn: b.paidOn,
    reference: b.reference,
    recordedBy: 'user-admin-1',
    status: 'unallocated',
    attachmentFilename: b.attachmentFilename ?? null,
    attachmentMimeType: b.attachmentMimeType ?? null,
    attachmentData: b.attachmentData ?? null,
    createdAt: new Date().toISOString(),
  };
  PROVIDER_PAYMENTS.push(p);
  return ok(p);
});

// Meter readings
on('GET', /\/payments\/meter-readings/, (url) => {
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const unitId = params.get('unitId');
  let results = METER_READINGS;
  if (unitId) results = results.filter(r => r.unitId === unitId);
  return ok(results);
});
on('POST', /\/payments\/meter-readings/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const reading = {
    id: `mr-${Date.now()}`,
    unitId: b.unitId as string,
    type: b.type as string,
    billingPeriodStart: b.billingPeriodStart as string,
    billingPeriodEnd: b.billingPeriodEnd as string,
    consumption: b.consumption as number,
    unit: (b.type === 'electricity_fee' ? 'kWh' : 'm3'),
  };
  METER_READINGS.push(reading);
  return ok(reading);
});
on('POST', /\/payments\/meter-readings/, (_url, body) => ok({ id: `mr-${Date.now()}`, ...(body as object) }));

// Allocation — rate-based calculation using the current quarter's rates
on('POST', /\/payments\/allocations\/compute\/[\w-]+$/, (url) => {
  const ppId = url.split('/').pop()!;
  const pp = PROVIDER_PAYMENTS.find(p => p.id === ppId);
  if (!pp) return err(404, 'Provider payment not found');

  const activeUnits = UNITS.filter(u => u.status === 'active');
  const ppType = pp.type as string;
  const lines: Array<Record<string, unknown>> = [];
  const unlinkedUnits: string[] = [];
  let totalComputed = 0;

  // Helper: find the active resident link for a unit (tenant preferred over owner)
  const getLinkForUnit = (unitId: string) => {
    const links = RESIDENT_LINKS.filter(l => l.unitId === unitId && l.endDate === null);
    const tenantLinks = links.filter(l => l.role === 'tenant');
    return tenantLinks.length > 0 ? tenantLinks[0] : links.find(l => l.role === 'owner');
  };

  // Helper: match meter readings by unit + type + billing period month
  const findReading = (unitId: string, type: string) => {
    const ppStart = new Date(pp.billingPeriodStart as string);
    return METER_READINGS.find(r => {
      if (r.unitId !== unitId || r.type !== type) return false;
      const rStart = new Date(r.billingPeriodStart);
      return rStart.getFullYear() === ppStart.getFullYear() && rStart.getMonth() === ppStart.getMonth();
    });
  };

  if (ppType === 'electricity_fee') {
    // Current quarter's commercial flat rate
    const currentLabel = getCurrentElecPeriodLabel();
    const commercialRate = ELECTRICITY_RATES.find(r => r.category === 'commercial' && r.periodLabel === currentLabel);
    const ratePerKwh = commercialRate?.ratePerKwh ?? 0;

    for (const unit of activeUnits) {
      const link = getLinkForUnit(unit.id);
      if (!link) { unlinkedUnits.push(unit.identifier); continue; }

      const reading = findReading(unit.id, 'electricity_fee');
      const consumption = reading?.consumption ?? 0;
      const chargeSantim = Math.round(consumption * ratePerKwh * 100);
      totalComputed += chargeSantim;

      const user = USERS.find(u => u.id === link.userId);
      lines.push({
        unitId: unit.id, unitIdentifier: unit.identifier, shareAmount: chargeSantim,
        payerId: link.userId, payerName: user?.fullName ?? null, payerRole: link.role, hasReading: !!reading,
      });
    }
  } else if (ppType === 'water_payment') {
    // Current water period rates — simple rate × consumption (not block tariff)
    const currentLabel = getCurrentWaterPeriodLabel();
    const waterRates = WATER_RATES.filter(r => r.periodLabel === currentLabel);

    for (const unit of activeUnits) {
      const link = getLinkForUnit(unit.id);
      if (!link) { unlinkedUnits.push(unit.identifier); continue; }

      const reading = findReading(unit.id, 'water_payment');
      const consumption = reading?.consumption ?? 0;

      // Find the tier matching this consumption level and multiply rate × consumption
      const tier = waterRates.find(r =>
        r.toM3 === null ? consumption >= r.fromM3
          : consumption >= r.fromM3 && consumption <= r.toM3
      );
      const ratePerM3 = tier?.ratePerM3 ?? 0;
      const chargeSantim = Math.round(consumption * ratePerM3 * 100);
      totalComputed += chargeSantim;

      const user = USERS.find(u => u.id === link.userId);
      lines.push({
        unitId: unit.id, unitIdentifier: unit.identifier, shareAmount: chargeSantim,
        payerId: link.userId, payerName: user?.fullName ?? null, payerRole: link.role, hasReading: !!reading,
      });
    }
  } else {
    // Service fee — flat rate per resident based on vehicle status
    const withVehicleSantim = SERVICE_FEE.withVehicleAmount * 100;
    const withoutVehicleSantim = SERVICE_FEE.withoutVehicleAmount * 100;

    for (const unit of activeUnits) {
      const link = getLinkForUnit(unit.id);
      if (!link) { unlinkedUnits.push(unit.identifier); continue; }

      const user = USERS.find(u => u.id === link.userId);
      const chargeSantim = user?.hasVehicle ? withVehicleSantim : withoutVehicleSantim;
      totalComputed += chargeSantim;

      lines.push({
        unitId: unit.id, unitIdentifier: unit.identifier, shareAmount: chargeSantim,
        payerId: link.userId, payerName: user?.fullName ?? null, payerRole: link.role, hasReading: true,
      });
    }
  }

  const ppAmount = pp.amount as number;
  const difference = totalComputed - ppAmount;

  return ok({
    allocationId: `alloc-draft-${ppId}`,
    lines,
    totalComputed,
    providerPaymentAmount: ppAmount,
    difference,
    valid: difference === 0,
    unlinkedUnits,
  });
});
on('POST', /\/payments\/allocations\/confirm/, () => ok({ id: `alloc-${Date.now()}`, status: 'confirmed' }));

// Charges
on('GET', /\/payments\/charges$/, () => ok(CHARGES));
on('GET', /\/payments\/charges\/[\w-]+$/, (url) => ok(CHARGES.find(c => c.id === url.split('/').pop()) ?? CHARGES[0]));

// Resident payments
on('POST', /\/payments\/resident\/manual/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const charge = CHARGES.find(c => c.id === b.chargeId);
  if (charge) {
    const paid = Number(b.amount);
    charge.paidAmount = (charge.paidAmount as number) + paid;
    charge.status = (charge.paidAmount >= (charge.amount as number) ? 'paid' : 'partially_paid') as typeof charge.status;
  }
  return ok({ id: `rp-${Date.now()}`, status: 'confirmed', ...b });
});
on('POST', /\/payments\/resident\/online\/[\w-]+$/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const payment = {
    id: `rp-${Date.now()}`,
    status: 'pending_confirmation',
    attachmentFilename: b.attachmentFilename ?? null,
    attachmentMimeType: b.attachmentMimeType ?? null,
    attachmentSizeBytes: b.attachmentSizeBytes ?? 0,
    // store data URL in mock; real backend would save to object storage
    attachmentData: b.attachmentData ?? null,
  };
  return ok(payment);
});
on('GET', /\/payments\/resident\/pending/, () => ok(PENDING_PAYMENTS));
on('POST', /\/payments\/resident\/pending$/, (_url, body) => {
  const b = body as Record<string, unknown>;
  const payment = {
    id: `rp-pending-${Date.now()}`,
    chargeId: b.chargeId,
    amount: b.amount,
    transactionFee: b.transactionFee ?? 0,
    method: b.method ?? 'cash',
    status: 'pending_confirmation',
    paidOn: b.paidOn,
    reference: b.reference,
    recordedBy: 'user-admin-1',
    attachmentFilename: b.attachmentFilename ?? null,
    attachmentMimeType: b.attachmentMimeType ?? null,
    attachmentData: b.attachmentData ?? null,
  };
  PENDING_PAYMENTS.push(payment);
  return ok(payment);
});
on('PATCH', /\/payments\/resident\/[\w-]+\/confirm/, (_url, body) => ok({ status: (body as { approved: boolean }).approved ? 'confirmed' : 'rejected' }));

// Ledger & config
on('GET', /\/payments\/ledger/, () => ok(LEDGER));
on('GET', /\/payments\/late-fee-config/, () => ok(LATE_FEE_CONFIGS));
on('POST', /\/payments\/late-fee-config/, (_url, body) => ok({ id: `lfc-${Date.now()}`, ...(body as object) }));

// ── Tariff pricing ────────────────────────────────────────────────────────────

// Service fee
on('GET', /\/pricing\/service-fee$/, () => ok(SERVICE_FEE));
on('PUT', /\/pricing\/service-fee$/, (_url, body) => {
  const b = body as { withVehicleAmount: number; withoutVehicleAmount: number };
  SERVICE_FEE = { ...SERVICE_FEE, ...b, updatedAt: new Date().toISOString(), updatedBy: 'user-admin-1' };
  return ok(SERVICE_FEE);
});

// Electricity rates — GET all, PUT a single rate
on('GET', /\/pricing\/electricity$/, () => ok(ELECTRICITY_RATES));
on('PUT', /\/pricing\/electricity\/[\w-]+$/, (url, body) => {
  const id = url.split('/').pop()!;
  const b = body as { ratePerKwh: number };
  const idx = ELECTRICITY_RATES.findIndex(r => r.id === id);
  if (idx >= 0) {
    ELECTRICITY_RATES[idx] = { ...ELECTRICITY_RATES[idx], ratePerKwh: b.ratePerKwh, updatedAt: new Date().toISOString(), updatedBy: 'user-admin-1' };
  }
  return ok(ELECTRICITY_RATES[idx] ?? {});
});

// Water rates — GET all, PUT a single rate
on('GET', /\/pricing\/water$/, () => ok(WATER_RATES));
on('PUT', /\/pricing\/water\/[\w-]+$/, (url, body) => {
  const id = url.split('/').pop()!;
  const b = body as { ratePerM3: number };
  const idx = WATER_RATES.findIndex(r => r.id === id);
  if (idx >= 0) {
    WATER_RATES[idx] = { ...WATER_RATES[idx], ratePerM3: b.ratePerM3, updatedAt: new Date().toISOString(), updatedBy: 'user-admin-1' };
  }
  return ok(WATER_RATES[idx] ?? {});
});

// Current tariff period — determined dynamically from today's date
on('GET', /\/pricing\/current-period$/, () => ok({
  electricityPeriodLabel: getCurrentElecPeriodLabel(),
  waterPeriodLabel: getCurrentWaterPeriodLabel(),
}));

// Vouchers
on('GET', /\/vouchers\/my/, () => ok(VOUCHERS.filter(v => v.payerId === 'user-resident-1')));
on('GET', /\/vouchers$/, (url) => {
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const ppId = params.get('providerPaymentId');
  const payerId = params.get('payerId');
  let result = [...VOUCHERS];
  if (ppId)     result = result.filter(v => v.providerPaymentId === ppId);
  if (payerId)  result = result.filter(v => v.payerId === payerId);
  return ok(result);
});
on('GET', /\/vouchers\/[\w-]+$/, (url) => ok(VOUCHERS.find(v => v.id === url.split('/').pop()) ?? VOUCHERS[0]));
on('PATCH', /\/vouchers\/[\w-]+\/void/, () => ok({ status: 'void' }));

// Assign voucher manually to a resident
on('POST', /\/vouchers\/assign$/, (_url, body) => {
  const b = body as Record<string, unknown>;
  // Auto-increment voucher number
  const maxNum = VOUCHERS.reduce((m, v) => Math.max(m, parseInt(v.voucherNumber, 10)), 0);
  const newNum = String(maxNum + 1).padStart(6, '0');
  const v = {
    id: `v-${Date.now()}`,
    voucherNumber: newNum,
    direction: b.direction as string,
    paymentType: b.paymentType as string,
    unitId: null,
    payerId: b.residentId as string,
    payerRole: 'tenant',
    chargeId: null,
    providerPaymentId: b.providerPaymentId as string ?? null,
    residentPaymentId: null,
    amount: b.amount as number,
    currency: 'ETB',
    paymentDate: b.paymentDate as string,
    reference: b.reference as string,
    issuedBy: 'user-admin-1',
    status: 'issued',
    createdAt: new Date().toISOString(),
  };
  VOUCHERS.push(v as unknown as typeof VOUCHERS[0]);
  return ok(v);
});

// Notices
on('GET', /\/notices\/my/, () => ok(NOTICES));
on('GET', /\/notices$/, () => ok(NOTICES));
on('POST', /\/notices$/, (_url, body) => { const n = { id: `n-${Date.now()}`, ...(body as object), audienceFilter: [] as string[], authorId: 'user-admin-1', isSystemGenerated: false, status: 'active' as const, publishedAt: new Date().toISOString(), retractedAt: null, retractedBy: null, createdAt: new Date().toISOString() }; NOTICES.push(n as unknown as typeof NOTICES[0]); return ok(n); });
on('PATCH', /\/notices\/[\w-]+\/read/, () => noContent());
on('PATCH', /\/notices\/[\w-]+\/retract/, () => ok({ status: 'retracted' }));
on('GET', /\/notices\/[\w-]+\/stats/, () => ok({ total: 12, delivered: 12, read: 8 }));

// Requests
on('GET', /\/requests\/my/, () => ok(REQUESTS));
on('GET', /\/requests$/, () => ok(REQUESTS));
on('GET', /\/requests\/[\w-]+$/, (url) => ok(REQUESTS.find(r => r.id === url.split('/').pop()) ?? REQUESTS[0]));
on('POST', /\/requests$/, (_url, body) => { const r = { id: `req-${Date.now()}`, unitId: 'unit-1', residentId: 'user-resident-1', ...(body as object), status: 'submitted' as const, assignedTo: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), history: [] as typeof REQUESTS[0]['history'], comments: [] as typeof REQUESTS[0]['comments'] }; REQUESTS.push(r as unknown as typeof REQUESTS[0]); return ok(r); });
on('PATCH', /\/requests\/[\w-]+\/status/, (_url, body) => ok({ status: (body as { status: string }).status }));
on('PATCH', /\/requests\/[\w-]+\/assign/, () => ok({}));
on('POST', /\/requests\/[\w-]+\/comments/, (_url, body) => ok({ id: `c-${Date.now()}`, ...(body as object), authorId: 'user-resident-1', createdAt: new Date().toISOString() }));

// ── Interceptor installer ─────────────────────────────────────────────────────

function makeResponse(config: InternalAxiosRequestConfig, result: MockResponse): AxiosResponse {
  return {
    data: result.data,
    status: result.status,
    statusText: result.status === 200 ? 'OK' : result.status === 204 ? 'No Content' : 'Error',
    headers: {},
    config,
  };
}

export function installMockInterceptor(axiosInstance: AxiosInstance): void {
  // Use a request interceptor that short-circuits by throwing a special sentinel
  // that the response interceptor then converts to a resolved/rejected response.
  // The key: we add BOTH interceptors here so they run as a pair.

  const MOCK_SYMBOL = '__phison_mock__';

  axiosInstance.interceptors.request.use(
    (config) => {
      const method = (config.method ?? 'GET').toUpperCase();
      // Strip base URL prefix and query string to get the path
      const rawUrl = config.url ?? '';
      const fullPath = rawUrl.startsWith('http') ? rawUrl.replace(/^https?:\/\/[^/]+/, '') : rawUrl;
      const pathOnly = fullPath.split('?')[0];

      for (const { method: m, pattern, handler } of routes) {
        if (m !== method) continue;
        if (!pattern.test(pathOnly)) continue;

        let body: unknown;
        try { body = config.data ? JSON.parse(config.data as string) : undefined; } catch { body = config.data; }

        const result = handler(pathOnly, body, {});

        // Attach result to config so the response interceptor can pick it up
        (config as InternalAxiosRequestConfig & { [MOCK_SYMBOL]: MockResponse })[MOCK_SYMBOL] = result;

        // Throw to skip the actual network request — but throw in a way that
        // our response error interceptor recognises
        const sentinel = Object.assign(new Error('mock'), {
          isMockSentinel: true,
          mockConfig: config,
          mockResult: result,
        });
        throw sentinel;
      }
      return config;
    },
    undefined,
    { synchronous: true, runWhen: () => true },
  );

  axiosInstance.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
      // If this is our mock sentinel, resolve or reject appropriately
      if (error && typeof error === 'object' && (error as { isMockSentinel?: boolean }).isMockSentinel) {
        const { mockConfig, mockResult } = error as { mockConfig: InternalAxiosRequestConfig; mockResult: MockResponse };
        const response = makeResponse(mockConfig, mockResult);

        if (mockResult.status >= 400) {
          // Simulate an axios error response
          const axiosErr = Object.assign(new Error((mockResult.data as { message?: string })?.message ?? 'Error'), {
            isAxiosError: true,
            response,
          });
          return Promise.reject(axiosErr);
        }
        return Promise.resolve(response);
      }
      return Promise.reject(error);
    },
  );
}
