/** Format santim (integer) as ETB currency string */
export function formatETB(santim: number): string {
  const birr = santim / 100;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(birr);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-ET', { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-ET', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
