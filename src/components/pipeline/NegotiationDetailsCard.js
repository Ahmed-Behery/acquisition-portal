import Card from '@/components/common/Card';
import DefinitionList from '@/components/common/DefinitionList';
import { MailLink } from '@/components/common/misc';
import { productNames, selectUser } from '@/domain/selectors';
import { fmtMoneyFull } from '@/utils/format';
import { isPastDate } from '@/utils/dates';

/** Everything captured about the prospect on the New Entry form. */
export default function NegotiationDetailsCard({ state, entry, today }) {
  const visitOverdue = isPastDate(entry.visitDate, today) && !entry.meetingOutcome;

  const prospectSuffix =
    entry.inList === false ? (
      <span className="small" style={{ color: 'var(--yellow)' }}>
        {' '}
        · not in directory (validate)
      </span>
    ) : entry.inList ? (
      <span className="small" style={{ color: 'var(--green)' }}>
        {' '}
        · from directory
      </span>
    ) : null;

  return (
    <Card title="Negotiation details">
      <DefinitionList
        items={[
          { term: 'Reference', value: <b>{entry.code || '—'}</b> },
          {
            term: 'Prospect',
            value: (
              <>
                {entry.prospect}
                {prospectSuffix}
              </>
            ),
          },
          { term: 'Industry', value: entry.industry },
          { term: 'Company size', value: entry.companySize || '—' },
          { term: 'Governorate', value: entry.governorate || '—' },
          { term: 'Commercial Register', value: entry.commercialRegister || '—' },
          {
            term: 'Contact person',
            value: (
              <>
                {entry.contactPerson || '—'}
                {entry.contactTitle ? (
                  <span className="small muted"> · {entry.contactTitle}</span>
                ) : null}
              </>
            ),
          },
          { term: 'Contact mobile', value: entry.contactMobile || '—' },
          {
            term: 'AML screening',
            value:
              entry.amlStatus === 'review' ? (
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>⚠ Watchlist match — review</span>
              ) : (
                <span style={{ color: 'var(--green)' }}>✓ Clear</span>
              ),
          },
          { term: 'Contact email', value: entry.contactEmail ? <MailLink email={entry.contactEmail} /> : '—' },
          { term: 'Products of interest', value: productNames(state, entry.productsOfInterest) },
          { term: 'Expected value / sales', value: entry.value ? fmtMoneyFull(entry.value) : '—' },
          { term: 'Expected close date', value: entry.expectedClose },
          {
            term: 'Visit date',
            value: (
              <>
                {entry.visitDate || '—'}
                {visitOverdue ? (
                  <span className="small" style={{ color: 'var(--orange)' }}>
                    {' '}
                    · past — outcome not recorded
                  </span>
                ) : null}
              </>
            ),
          },
          {
            term: 'Attendees',
            value:
              entry.attendees?.length
                ? entry.attendees
                    .map((id) => selectUser(state, id)?.name)
                    .filter(Boolean)
                    .join(', ')
                : '—',
          },
          { term: 'Negotiation summary', value: entry.summary, valueStyle: { fontWeight: 400, fontStyle: 'italic' } },
        ]}
      />
    </Card>
  );
}
