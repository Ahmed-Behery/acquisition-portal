import Banner from '@/components/common/Banner';
import { INTEREST_CONTACT_SLA_DAYS } from '@/constants/pipeline';
import { selectProduct, selectUser } from '@/domain/selectors';

/** Per-flag SLA line: contacted, overdue, or still inside the window. */
function SlaStatus({ flag, contactName, today }) {
  if (flag.contacted) {
    return <span className="small" style={{ color: 'var(--green)' }}>✓ Contacted {flag.contactedAt || ''}</span>;
  }
  if (flag.dueDate && today > flag.dueDate) {
    return (
      <span className="small" style={{ color: 'var(--red)' }}>
        ⚠ Overdue — was due {flag.dueDate}
        {flag.escalated ? ' · escalated to manager' : ''}
      </span>
    );
  }
  return (
    <span className="small" style={{ color: 'var(--orange)' }}>
      ⏱ Call <b>{contactName}</b> within {INTEREST_CONTACT_SLA_DAYS} working days — due {flag.dueDate || '—'}
    </span>
  );
}

/** Stakeholder interest, with the contact SLA the RM has to meet. */
export default function InterestBanner({ state, entry, canMark, today, onMarkContacted }) {
  const flags = entry.interestedFlags;
  if (!flags?.length) return null;

  return (
    <Banner tone="success">
      <b>Interest from stakeholders</b>
      {flags.map((flag) => {
        const flaggerName = flag.name || selectUser(state, flag.userId)?.name || 'Unknown';
        const flaggerRole = flag.role || selectUser(state, flag.userId)?.role || '';
        const contactId = flag.delegatedTo || flag.userId;
        const contactName = selectUser(state, contactId)?.name || flaggerName;
        const productLabel = flag.productId ? selectProduct(state, flag.productId)?.name || '' : '';

        return (
          <div key={flag.userId} style={{ marginTop: 7 }}>
            🎯 <b>{flaggerName}</b> <span className="small muted">({flaggerRole})</span> is interested
            {productLabel ? (
              <>
                {' '}
                · <b>{productLabel}</b>
              </>
            ) : null}
            {flag.delegatedTo ? (
              <span className="small" style={{ color: 'var(--primary)' }}>
                {' '}
                → delegated to <b>{flag.delegatedToName || contactName}</b>
              </span>
            ) : null}
            {flag.message ? (
              <>
                : <i>&quot;{flag.message}&quot;</i>
              </>
            ) : null}
            <div style={{ marginTop: 3 }}>
              <SlaStatus flag={flag} contactName={contactName} today={today} />
              {!flag.contacted && canMark ? (
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  style={{ marginLeft: 6 }}
                  onClick={() => onMarkContacted(flag.userId)}
                >
                  Mark contacted
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      <div className="small muted" style={{ fontWeight: 400, marginTop: 7 }}>
        The RM must contact each person shown (the delegate, where a lead was delegated) within{' '}
        <b>{INTEREST_CONTACT_SLA_DAYS} working days</b> and click “Mark contacted”, or it escalates.
      </div>
    </Banner>
  );
}
