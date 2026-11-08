import { Tag } from 'antd';
import { colors } from '../../theme';

interface StatusTagProps {
  status: string;
  /** Override the default status-to-color mapping */
  preset?: keyof typeof PRESETS;
}

const PRESETS = {
  issued:        { bg: colors.tagIssued.bg,      text: colors.tagIssued.text },
  paid:          { bg: colors.tagPaid.bg,         text: colors.tagPaid.text },
  partially_paid:{ bg: colors.tagPartial.bg,      text: colors.tagPartial.text },
  overdue:       { bg: colors.tagOverdue.bg,      text: colors.tagOverdue.text },
  cancelled:     { bg: '#F3F4F6',                 text: '#6B7280' },
  registered:    { bg: colors.tagRegistered.bg,   text: colors.tagRegistered.text },
  house:         { bg: colors.tagHouse.bg,        text: colors.tagHouse.text },
  material:      { bg: colors.tagMaterial.bg,     text: colors.tagMaterial.text },
  active:        { bg: colors.tagPaid.bg,         text: colors.tagPaid.text },
  suspended:     { bg: colors.tagOverdue.bg,      text: colors.tagOverdue.text },
  void:          { bg: '#F3F4F6',                 text: '#6B7280' },
  // request statuses
  submitted:     { bg: '#FFF8E1',                 text: '#E67E22' },
  acknowledged:  { bg: '#EBF5FB',                 text: '#2980B9' },
  in_progress:   { bg: '#EFF0FF',                 text: '#2D3B8E' },
  resolved:      { bg: colors.tagPaid.bg,         text: colors.tagPaid.text },
  closed:        { bg: '#F3F4F6',                 text: '#6B7280' },
  rejected:      { bg: colors.tagOverdue.bg,      text: colors.tagOverdue.text },
  // provider payment statuses
  unallocated:   { bg: '#FFF8E1',                 text: '#E67E22' },
  allocated:     { bg: colors.tagPaid.bg,         text: colors.tagPaid.text },
  reversed:      { bg: '#F3F4F6',                 text: '#6B7280' },
  // notice
  retracted:     { bg: '#F3F4F6',                 text: '#6B7280' },
  pending_confirmation: { bg: '#FFF8E1',          text: '#E67E22' },
  confirmed:     { bg: colors.tagPaid.bg,         text: colors.tagPaid.text },
} as const;

export function StatusTag({ status }: StatusTagProps) {
  const key = status.toLowerCase() as keyof typeof PRESETS;
  const style = PRESETS[key] ?? { bg: '#F3F4F6', text: '#6B7280' };
  const label = status.replace(/_/g, ' ');

  return (
    <Tag
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: 'none',
        borderRadius: 4,
        fontWeight: 500,
        fontSize: 12,
        padding: '2px 8px',
      }}
    >
      {label}
    </Tag>
  );
}
