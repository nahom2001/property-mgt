/**
 * Request type configuration.
 *
 * Add new entries here to expose them in the resident form and admin filters
 * without touching any component code.
 */
export interface RequestTypeConfig {
  value: string;
  label: string;
}

export const REQUEST_TYPES: RequestTypeConfig[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other',       label: 'Other' },
];

/** Human-readable label for a request type value */
export function getRequestTypeLabel(value: string): string {
  return REQUEST_TYPES.find(t => t.value === value)?.label ?? value;
}

/** Status display config — maps internal status to resident-facing label */
export const REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted:    'Open',
  acknowledged: 'Open',
  in_progress:  'In progress',
  resolved:     'Resolved',
  closed:       'Closed',
  rejected:     'Rejected',
};

export function getRequestStatusLabel(status: string): string {
  return REQUEST_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}
