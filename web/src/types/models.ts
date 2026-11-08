import type {
  UserRole,
  UserStatus,
  UnitType,
  UnitStatus,
  ResidentRole,
  PaymentType,
  AllocationRule,
  ProviderPaymentStatus,
  AllocationStatus,
  ChargeStatus,
  ResidentPaymentMethod,
  ResidentPaymentStatus,
  MeterUnit,
  VoucherDirection,
  VoucherStatus,
  NoticeCategory,
  NoticeAudienceType,
  NoticeStatus,
  NoticeDeliveryChannel,
  NoticeDeliveryStatus,
  RequestCategory,
  RequestStatus,
  CommentVisibility,
  AuditAction,
} from './enums';

// ─── Foundation ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: 'am' | 'en';
  /** Resident-only: does the resident have a vehicle */
  hasVehicle: boolean | null;
  /** Resident-only: vehicle plate number */
  vehicleNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  identifier: string;
  type: UnitType;
  area: number | null;
  floor: string | null;
  notes: string | null;
  status: UnitStatus;
  blockId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentUnitLink {
  id: string;
  userId: string;
  unitId: string;
  role: ResidentRole;
  startDate: string;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  timestamp: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────

export interface ProviderPayment {
  id: string;
  type: PaymentType;
  provider: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  /** Amount in santim (ETB × 100) */
  amount: number;
  currency: 'ETB';
  paidOn: string;
  reference: string;
  recordedBy: string;
  status: ProviderPaymentStatus;
  createdAt: string;
}

export interface MeterReading {
  id: string;
  unitId: string;
  type: PaymentType.ElectricityFee | PaymentType.WaterPayment;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  /** Consumption in kWh or m³ */
  consumption: number;
  unit: MeterUnit;
  recordedBy: string;
  createdAt: string;
}

export interface Allocation {
  id: string;
  providerPaymentId: string;
  rule: AllocationRule;
  status: AllocationStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface AllocationLine {
  id: string;
  allocationId: string;
  unitId: string;
  /** Share in santim */
  shareAmount: number;
  currency: 'ETB';
}

export interface Charge {
  id: string;
  allocationId: string;
  unitId: string;
  payerId: string;
  payerRole: ResidentRole;
  /** Amount in santim */
  amount: number;
  /** Amount paid so far in santim */
  paidAmount: number;
  currency: 'ETB';
  dueDate: string;
  status: ChargeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LateFee {
  id: string;
  chargeId: string;
  /** Amount in santim */
  amount: number;
  currency: 'ETB';
  appliedAt: string;
}

export interface ResidentPayment {
  id: string;
  chargeId: string;
  /** Amount in santim */
  amount: number;
  /** Transaction fee in santim (0 for manual) */
  transactionFee: number;
  currency: 'ETB';
  method: ResidentPaymentMethod;
  status: ResidentPaymentStatus;
  paidOn: string;
  reference: string;
  recordedBy: string;
  confirmedBy: string | null;
  createdAt: string;
}

export interface LateFeeConfig {
  id: string;
  paymentType: PaymentType;
  /** Flat fee in santim */
  amount: number;
  currency: 'ETB';
  updatedBy: string;
  updatedAt: string;
}

// ─── Service fee configuration ───────────────────────────────────────────────

export interface ServiceFeeConfig {
  id: string;
  /** ETB amount in santim for residents WITH a vehicle */
  withVehicleAmount: number;
  /** ETB amount in santim for residents WITHOUT a vehicle */
  withoutVehicleAmount: number;
  currency: 'ETB';
  updatedBy: string;
  updatedAt: string;
}

// ─── Resident extra fields (stored on User or via separate profile) ───────────

/** Resident vehicle details — attached to a user record */
export interface ResidentVehicleInfo {
  hasVehicle: boolean;
  vehicleNumber: string | null;
}

// ─── Resident payment record (charge confirmation with attachment) ────────────

export interface ResidentPaymentConfirmation {
  id: string;
  residentPaymentId: string;
  /** Staff member who confirmed */
  confirmedBy: string;
  confirmedAt: string;
  /** File name of the proof attachment */
  attachmentFilename: string;
  /** MIME type — must be PDF or image */
  attachmentMimeType: string;
  /** Size in bytes — must be ≤ 10 MB */
  attachmentSizeBytes: number;
  /** URL or storage reference */
  attachmentUrl: string;
}

// ─── Resident import ─────────────────────────────────────────────────────────

export interface ImportResidentRow {
  rowNumber: number;
  fullName: string;
  email: string;
  phone: string;
  unitIdentifier: string;
  residentRole: 'tenant' | 'owner';
  hasVehicle: boolean;
  vehicleNumber: string | null;
  /** Resolved from unitIdentifier during validation */
  unitId: string | null;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  rows: ImportResidentRow[];
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  direction: VoucherDirection;
  paymentType: PaymentType;
  unitId: string | null;
  payerId: string | null;
  payerRole: ResidentRole | null;
  chargeId: string | null;
  providerPaymentId: string | null;
  /** Amount in santim */
  amount: number;
  currency: 'ETB';
  paymentDate: string;
  reference: string;
  issuedBy: string;
  status: VoucherStatus;
  createdAt: string;
}

// ─── Notices ────────────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  audienceType: NoticeAudienceType;
  audienceFilter: string[] | null;
  authorId: string;
  isSystemGenerated: boolean;
  status: NoticeStatus;
  publishedAt: string;
  retractedAt: string | null;
  retractedBy: string | null;
  createdAt: string;
}

export interface NoticeRecipient {
  id: string;
  noticeId: string;
  residentId: string;
  deliveredAt: string;
  readAt: string | null;
}

export interface NoticeDeliveryLog {
  id: string;
  noticeId: string;
  residentId: string;
  channel: NoticeDeliveryChannel;
  attemptedAt: string;
  status: NoticeDeliveryStatus;
  errorDetail: string | null;
}

// ─── Requests ───────────────────────────────────────────────────────────────

export interface ResidentRequest {
  id: string;
  unitId: string;
  residentId: string;
  category: RequestCategory;
  subject: string;
  description: string;
  status: RequestStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  actorId: string;
  comment: string | null;
  timestamp: string;
}

export interface RequestComment {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  visibility: CommentVisibility;
  createdAt: string;
}

export interface RequestAttachment {
  id: string;
  requestId: string | null;
  commentId: string | null;
  uploaderId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageReference: string;
  createdAt: string;
}
