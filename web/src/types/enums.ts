// ─── User & Auth ────────────────────────────────────────────────────────────

export enum UserRole {
  Admin = 'admin',
  Staff = 'staff',
  Resident = 'resident',
}

export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
}

// ─── Units ──────────────────────────────────────────────────────────────────

export enum UnitType {
  Apartment = 'apartment',
  House = 'house',
  Other = 'other',
}

export enum UnitStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum ResidentRole {
  Tenant = 'tenant',
  Owner = 'owner',
}

// ─── Payments ───────────────────────────────────────────────────────────────

export enum PaymentType {
  ServiceFee = 'service_fee',
  ElectricityFee = 'electricity_fee',
  WaterPayment = 'water_payment',
}

export enum AllocationRule {
  EqualShare = 'equal_share',
  Metered = 'metered',
}

export enum ProviderPaymentStatus {
  Unallocated = 'unallocated',
  Allocated = 'allocated',
  Reversed = 'reversed',
}

export enum AllocationStatus {
  Draft = 'draft',
  Confirmed = 'confirmed',
  Reversed = 'reversed',
}

export enum ChargeStatus {
  Issued = 'issued',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export enum ResidentPaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  Online = 'online',
}

export enum ResidentPaymentStatus {
  PendingConfirmation = 'pending_confirmation',
  Confirmed = 'confirmed',
  Rejected = 'rejected',
}

export enum MeterUnit {
  KWh = 'kWh',
  CubicMeter = 'm3',
}

// ─── Vouchers ───────────────────────────────────────────────────────────────

export enum VoucherDirection {
  Outgoing = 'outgoing',
  Incoming = 'incoming',
}

export enum VoucherStatus {
  Issued = 'issued',
  Void = 'void',
}

// ─── Notices ────────────────────────────────────────────────────────────────

export enum NoticeCategory {
  Payment = 'payment',
  Maintenance = 'maintenance',
  Outage = 'outage',
  General = 'general',
}

export enum NoticeAudienceType {
  All = 'all',
  Units = 'units',
  OwnersOnly = 'owners_only',
  TenantsOnly = 'tenants_only',
  Individuals = 'individuals',
}

export enum NoticeStatus {
  Active = 'active',
  Retracted = 'retracted',
}

export enum NoticeDeliveryChannel {
  InApp = 'in_app',
}

export enum NoticeDeliveryStatus {
  Sent = 'sent',
  Failed = 'failed',
}

// ─── Requests ───────────────────────────────────────────────────────────────

/**
 * RequestType — the resident-facing type selector.
 * Add new values here; the form reads from this enum so no component changes
 * are needed when a new type is introduced.
 */
export enum RequestType {
  Maintenance = 'maintenance',
  Other = 'other',
}

/** Legacy category enum kept for backward compatibility with existing data */
export enum RequestCategory {
  Maintenance = 'maintenance',
  Complaint = 'complaint',
  Billing = 'billing',
  Query = 'query',
  Other = 'other',
}

export enum RequestStatus {
  /** Resident-visible label: "Open" */
  Submitted = 'submitted',
  Acknowledged = 'acknowledged',
  /** Resident-visible label: "In progress" */
  InProgress = 'in_progress',
  /** Resident-visible label: "Resolved" */
  Resolved = 'resolved',
  Closed = 'closed',
  Rejected = 'rejected',
}

export enum CommentVisibility {
  Public = 'public',
  Internal = 'internal',
}

// ─── Service fees ────────────────────────────────────────────────────────────

/**
 * Service fee is a flat amount per resident, split by vehicle ownership.
 * Only authorized personnel (admin role) may edit these values.
 */
export enum ServiceFeeVehicleTier {
  WithVehicle = 'with_vehicle',
  WithoutVehicle = 'without_vehicle',
}

// ─── Resident import ─────────────────────────────────────────────────────────

export enum ImportRowStatus {
  Valid = 'valid',
  Invalid = 'invalid',
  Duplicate = 'duplicate',
}

export enum AuditAction {
  // Users
  UserCreated = 'user.created',
  UserRoleChanged = 'user.role_changed',
  UserSuspended = 'user.suspended',
  UserReactivated = 'user.reactivated',
  // Units
  UnitCreated = 'unit.created',
  UnitUpdated = 'unit.updated',
  UnitStatusChanged = 'unit.status_changed',
  // Links
  LinkCreated = 'link.created',
  LinkClosed = 'link.closed',
  // Payments
  ProviderPaymentRecorded = 'provider_payment.recorded',
  ProviderPaymentReversed = 'provider_payment.reversed',
  AllocationConfirmed = 'allocation.confirmed',
  AllocationReversed = 'allocation.reversed',
  ResidentPaymentConfirmed = 'resident_payment.confirmed',
  ResidentPaymentRejected = 'resident_payment.rejected',
  ResidentPaymentReversed = 'resident_payment.reversed',
  // Vouchers
  VoucherCreated = 'voucher.created',
  VoucherVoided = 'voucher.voided',
  // Notices
  NoticePublished = 'notice.published',
  NoticeRetracted = 'notice.retracted',
  // Requests
  RequestCreated = 'request.created',
  RequestStatusChanged = 'request.status_changed',
  RequestAssigned = 'request.assigned',
  RequestCommentAdded = 'request.comment_added',
}
