import { useActions } from '@/hooks/useActions';

/**
 * The decision buttons the Head of Products sees, driven by the pending status.
 * Declaring them as data keeps the markup flat and makes the matrix easy to audit.
 */
export default function HopReviewActions({ entry }) {
  const actions = useActions();
  const id = entry.id;

  const BY_STATUS = {
    'Pending HoP — Validation': [
      { label: 'Approve — case validated', tone: 'btn-success', run: () => actions.hop.approveValidation(id) },
      entry.inList === false && {
        label: 'Return — “please choose prospect name”',
        tone: '',
        run: () => actions.hop.returnChooseName(id),
      },
      { label: 'Return to RM (with comment)', tone: 'btn-danger', run: () => actions.hop.returnEntry(id) },
    ],
    'Pending HoP — Cross-sell': [
      {
        label: 'Approve — different dept & product confirmed',
        tone: 'btn-success',
        run: () => actions.hop.approveValidation(id),
      },
      { label: 'Return to RM (with comment)', tone: 'btn-danger', run: () => actions.hop.returnEntry(id) },
    ],
    'Pending HoP — Extend': [
      { label: 'Approve extension', tone: 'btn-success', run: () => actions.hop.approveExtension(id) },
      { label: 'Reject — close entry', tone: 'btn-danger', run: () => actions.hop.rejectSubmission(id, 'extend') },
    ],
    'Pending HoP — Done Deal': [
      { label: 'Approve & convert to merchant', tone: 'btn-success', run: () => actions.hop.approveDoneDeal(id) },
      {
        label: 'Reject — return to Negotiation',
        tone: 'btn-danger',
        run: () => actions.hop.rejectSubmission(id, 'done'),
      },
    ],
    'Pending HoP — Late Entry': [
      { label: 'Approve late entry', tone: 'btn-success', run: () => actions.hop.approveLateEntry(id) },
      { label: 'Reject — discard entry', tone: 'btn-danger', run: () => actions.hop.rejectLateEntry(id) },
    ],
    'Pending HoP — Edit': [
      { label: 'Approve edits', tone: 'btn-success', run: () => actions.hop.approveEdit(id) },
      { label: 'Reject edits', tone: 'btn-danger', run: () => actions.hop.rejectEdit(id) },
    ],
    'Pending HoP — Delete': [
      { label: 'Approve — delete permanently', tone: 'btn-danger', run: () => actions.hop.approveDelete(id) },
      { label: 'Reject — keep entry', tone: '', run: () => actions.hop.rejectDelete(id) },
    ],
  };

  const buttons = (BY_STATUS[entry.status] || []).filter(Boolean);
  if (!buttons.length) return null;

  return (
    <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
      {buttons.map((button) => (
        <button key={button.label} type="button" className={`btn ${button.tone}`.trim()} onClick={button.run}>
          {button.label}
        </button>
      ))}
    </div>
  );
}
