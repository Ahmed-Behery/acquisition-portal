/**
 * Status indicators.
 *
 * These carry the exact colours the original app used. Keeping them in one module
 * means a status colour is defined once, not repeated at every call site.
 */
import { colors } from '@/theme/tokens';

const STATUS_CLASS = {
  Active: 'badge-active',
  Stagnant: 'badge-stagnant',
  'Good to Go': 'badge-good',
  'First Meeting': 'badge-neg',
  Negotiation: 'badge-neg',
  'Negotiation C1': 'badge-ext',
  'Negotiation C2': 'badge-ext',
  'Extend Negotiation': 'badge-ext',
  'Pending HoP — Extend': 'badge-hop',
  'Pending HoP — Done Deal': 'badge-hop',
  'Pending HoP — Edit': 'badge-hop',
  'Pending HoP — Delete': 'badge-hop',
  'Pending HoP — Late Entry': 'badge-hop',
  'Pending HoP — Validation': 'badge-hop',
  'Pending HoP — Cross-sell': 'badge-hop',
  'Returned to RM': 'badge-stagnant',
  'Done Deal': 'badge-conv',
  'Converted - Active Client': 'badge-conv',
  'Closed - Lost': 'badge-lost',
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || 'badge-lost'}`}>{status}</span>;
}

/** Payment behaviour indicator — good (green), regular (orange), bad (red). */
const PAYMENT_META = {
  good: { color: colors.green, bg: colors.greenSoft, label: 'Good' },
  regular: { color: colors.orange, bg: colors.orangeSoft, label: 'Not regular' },
  bad: { color: colors.red, bg: colors.redSoft, label: 'Bad' },
};
const PAYMENT_FALLBACK = { color: '#94a3b8', bg: '#f1f5f9', label: '—' };

export const paymentMeta = (value) => PAYMENT_META[value] || PAYMENT_FALLBACK;

export function PaymentBadge({ value }) {
  const meta = paymentMeta(value);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 999,
        background: meta.bg,
        color: meta.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function PaymentDot({ value }) {
  const meta = paymentMeta(value);
  return (
    <span
      title={`Payment behaviour: ${meta.label}`}
      style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: meta.color }}
    />
  );
}

/** Pill used for per-product negotiation stages and referral statuses. */
function Pill({ color, background, children }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 999, background, color, fontSize: 11, fontWeight: 600 }}>
      {children}
    </span>
  );
}

const PRODUCT_SUBSTATUS_COLORS = {
  Negotiation: [colors.orange, colors.orangeSoft],
  Booked: [colors.green, colors.greenSoft],
  'On hold': ['#854d0e', colors.yellowSoft],
  Dropped: [colors.red, colors.redSoft],
};

export function ProductSubStatusBadge({ status }) {
  const [color, background] = PRODUCT_SUBSTATUS_COLORS[status] || ['#475569', '#f1f5f9'];
  return (
    <Pill color={color} background={background}>
      {status || '—'}
    </Pill>
  );
}

const REFERRAL_STATUS_COLORS = {
  Open: [colors.orange, colors.orangeSoft],
  Delegated: [colors.primary, colors.primarySoft],
  Converted: [colors.green, colors.greenSoft],
  Closed: ['#475569', '#f1f5f9'],
};

export function ReferralStatusBadge({ status }) {
  const [color, background] = REFERRAL_STATUS_COLORS[status] || ['#475569', '#f1f5f9'];
  return (
    <Pill color={color} background={background}>
      {status}
    </Pill>
  );
}
