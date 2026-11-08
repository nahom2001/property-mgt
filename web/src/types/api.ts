/**
 * Shared API request/response shapes used by both the frontend and backend.
 * All amounts are in santim (ETB × 100). Dates are ISO-8601 strings.
 */

import type { UserRole, ResidentRole, UnitType, PaymentType, RequestCategory, NoticeCategory, NoticeAudienceType, CommentVisibility } from './enums';

// ─── Generic ─────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  preferredLanguage?: 'am' | 'en';
}

export interface UpdateUserRequest {
  fullName?: string;
  preferredLanguage?: 'am' | 'en';
}

// ─── Residents (extended user creation) ──────────────────────────────────────

export interface RegisterResidentRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  residentRole: ResidentRole;  // tenant | owner
  unitId: string;
  startDate: string;           // ISO-8601 date for the unit link
  status?: 'active' | 'suspended';
  preferredLanguage?: 'am' | 'en';
  hasVehicle: boolean;
  vehicleNumber?: string;
}

export interface UpdateResidentRequest {
  fullName?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'suspended';
  preferredLanguage?: 'am' | 'en';
  hasVehicle?: boolean;
  vehicleNumber?: string | null;
}

// ─── Bulk resident import ─────────────────────────────────────────────────────

export interface ValidateImportRequest {
  /** Array of raw rows parsed from the Excel file */
  rows: Array<{
    fullName: string;
    email: string;
    phone: string;
    unitIdentifier: string;
    residentRole: string;
    hasVehicle: string;   // 'yes' | 'no' from Excel
    vehicleNumber: string;
  }>;
}

export interface ConfirmImportRequest {
  /** Only the rows with status=valid from the validation response */
  rows: Array<{
    fullName: string;
    email: string;
    phone: string;
    unitId: string;
    residentRole: 'tenant' | 'owner';
    hasVehicle: boolean;
    vehicleNumber: string | null;
  }>;
}

// ─── Units ───────────────────────────────────────────────────────────────────

export interface CreateUnitRequest {
  identifier: string;
  type: UnitType;
  area?: number;
  floor?: string;
  notes?: string;
}

export interface UpdateUnitRequest {
  identifier?: string;
  type?: UnitType;
  area?: number;
  floor?: string;
  notes?: string;
}

// ─── Resident-Unit Links ─────────────────────────────────────────────────────

export interface CreateResidentLinkRequest {
  userId: string;
  unitId: string;
  role: ResidentRole;
  startDate: string;
}

export interface CloseResidentLinkRequest {
  endDate: string;
}

// ─── Provider Payments ───────────────────────────────────────────────────────

export interface CreateProviderPaymentRequest {
  type: PaymentType;
  provider: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  /** Amount in santim */
  amount: number;
  paidOn: string;
  reference: string;
}

// ─── Meter Readings ──────────────────────────────────────────────────────────

export interface CreateMeterReadingRequest {
  unitId: string;
  type: PaymentType.ElectricityFee | PaymentType.WaterPayment;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  consumption: number;
}

// ─── Allocations ─────────────────────────────────────────────────────────────

export interface ComputeAllocationResponse {
  allocationId: string;
  lines: Array<{
    unitId: string;
    unitIdentifier: string;
    shareAmount: number;
    payerId: string | null;
    payerName: string | null;
    payerRole: ResidentRole | null;
    hasReading: boolean;
  }>;
  totalComputed: number;
  providerPaymentAmount: number;
  difference: number;
  valid: boolean;
  unlinkedUnits: string[];
}

export interface ConfirmAllocationRequest {
  allocationId: string;
  dueDate: string;
}

// ─── Resident Payments ───────────────────────────────────────────────────────

export interface RecordManualPaymentRequest {
  chargeId: string;
  /** Amount in santim */
  amount: number;
  method: 'cash' | 'bank_transfer';
  paidOn: string;
  reference: string;
}

export interface ConfirmOnlinePaymentRequest {
  approved: boolean;
  note?: string;
}

// ─── Service fee configuration ───────────────────────────────────────────────

export interface UpsertServiceFeeConfigRequest {
  /** Amount in santim for residents WITH a vehicle */
  withVehicleAmount: number;
  /** Amount in santim for residents WITHOUT a vehicle */
  withoutVehicleAmount: number;
}

// ─── Payment confirmation with attachment ─────────────────────────────────────

export interface ConfirmResidentPaymentRequest {
  residentPaymentId: string;
  /** Base64-encoded file content (mock) or multipart in real backend */
  attachmentData: string;
  attachmentFilename: string;
  attachmentMimeType: string;
  attachmentSizeBytes: number;
}

// ─── Unit cost (price per kWh / m³) ──────────────────────────────────────────

export interface UpsertUnitCostRequest {
  type: 'electricity_fee' | 'water_payment';
  /** Cost in santim per unit (kWh or m³) */
  costPerUnit: number;
  effectiveDate: string;
}

export interface UnitCost {
  id: string;
  type: 'electricity_fee' | 'water_payment';
  /** Cost in santim per unit */
  costPerUnit: number;
  effectiveDate: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CreateNoticeRequest {
  title: string;
  body: string;
  category: NoticeCategory;
  audienceType: NoticeAudienceType;
  /** Unit IDs, resident IDs, depending on audienceType */
  audienceFilter?: string[];
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface CreateRequestRequest {
  category: RequestCategory;
  subject: string;
  description: string;
}

export interface UpdateRequestStatusRequest {
  status: string;
  comment?: string;
}

export interface AssignRequestRequest {
  assignedTo: string;
}

export interface AddCommentRequest {
  body: string;
  visibility: CommentVisibility;
}
