import { useRouter } from 'next/router';
import Banner from '@/components/common/Banner';
import InterestBanner from './InterestBanner';
import { productNames, selectClient, selectCompany, selectUser } from '@/domain/selectors';
import { colors } from '@/theme/tokens';
import { routes } from '@/utils/links';

/**
 * Every conditional callout on a pipeline entry, in the order the original showed
 * them. Each block is a small local component so the page itself stays readable.
 */
export default function PipelineBanners({
  state,
  entry,
  today,
  isHop,
  needsOutcome,
  canRecordOutcome,
  canMarkContacted,
  onMarkContacted,
  onRecordOutcome,
}) {
  const router = useRouter();
  const entrant = selectUser(state, entry.enteredBy || entry.rmId);

  return (
    <>
      <InterestBanner
        state={state}
        entry={entry}
        canMark={canMarkContacted}
        today={today}
        onMarkContacted={onMarkContacted}
      />

      {entry.pendingEdit ? (
        <Banner tone="warn">
          <b>Edit pending Head of Products approval.</b> {entrant?.name} requested changes to this entry.
          {isHop ? ' Review the proposed changes below.' : ''}
        </Banner>
      ) : null}

      {entry.pendingDelete ? (
        <Banner tone="danger">
          <b>Deletion pending Head of Products approval.</b> {entrant?.name} requested deletion. Reason:{' '}
          <i>&quot;{entry.pendingDelete.reason}&quot;</i>
        </Banner>
      ) : null}

      {entry.status === 'Pending HoP — Extend' ? (
        <Banner tone="warn">
          <b>Extension request pending HoP approval.</b>
          <br />
          <i>&quot;{entry.extendDetails || ''}&quot;</i>
          {entry.uploadedDoc ? (
            <>
              <br />
              <b>Attachment:</b> 📎 {entry.uploadedDoc}
            </>
          ) : null}
        </Banner>
      ) : null}

      {entry.status === 'Pending HoP — Done Deal' ? (
        <Banner tone="success">
          <b>Done Deal pending HoP approval.</b>
          <br />
          <b>Sold products:</b> {entry.doneDetails || ''}
          <br />
          {entry.uploadedDoc ? (
            <>
              <b>Signed contract:</b> 📎 {entry.uploadedDoc}
            </>
          ) : (
            <i>No contract attached</i>
          )}
        </Banner>
      ) : null}

      {entry.status === 'Pending HoP — Late Entry' && entry.lateEntry ? (
        <Banner tone="warn">
          <b>Late entry pending HoP approval.</b> This entry was created AFTER the visit date ({entry.visitDate}) —
          entries should be created before the visit.
          <br />
          <b>Reason given:</b> <i>&quot;{entry.lateEntry.reason}&quot;</i>
          <br />
          <b>Closure date claimed:</b> {entry.lateEntry.closureDate}
          <br />
          {entry.lateEntry.minutes ? (
            <>
              <b>Minutes provided:</b> &quot;{entry.lateEntry.minutes}&quot;
            </>
          ) : null}
          {entry.lateEntry.callReport ? (
            <>
              <br />
              <b>Call report:</b> 📎 {entry.lateEntry.callReport}
            </>
          ) : null}
        </Banner>
      ) : null}

      {entry.status === 'Good to Go' ? (
        <Banner tone="info">
          <b>This entry is on the Good to Go list.</b> No update was made within the lifecycle window. Any RM may now
          request to re-engage. MD and CEO have been notified.
        </Banner>
      ) : null}

      {entry.status === 'Pending HoP — Validation' ? (
        <Banner tone="warn">
          <b>Pending Head of Products validation.</b>{' '}
          {entry.inList === false ? (
            <>
              The RM marked this prospect as <b>NOT in the directory</b> — verify whether it actually exists. If it
              does, return it with “Please choose prospect name.”
            </>
          ) : (
            'Prospect selected from the directory.'
          )}{' '}
          The HoP validates the whole case before it proceeds.
        </Banner>
      ) : null}

      {entry.status === 'Pending HoP — Cross-sell' && entry.crossSell ? (
        <CrossSellBanner state={state} entry={entry} onOpenMerchant={(id) => router.push(routes.clientDetail(id))} />
      ) : null}

      {entry.status === 'Returned to RM' ? <ReturnedBanner entry={entry} /> : null}

      {needsOutcome ? (
        <Banner
          tone="warn"
          action={
            canRecordOutcome ? (
              <button type="button" className="btn btn-primary" onClick={onRecordOutcome}>
                Record outcome
              </button>
            ) : null
          }
        >
          <b>Visit date has passed — meeting outcome not yet recorded.</b>
          <br />
          Please enter the closure date and minutes of meeting, or upload a call report.
        </Banner>
      ) : null}

      {entry.meetingOutcome && !entry.lateEntry ? (
        <Banner tone="success">
          <b>Meeting outcome recorded {entry.meetingOutcome.recordedAt}.</b>
          <br />
          <b>Closure date:</b> {entry.meetingOutcome.closureDate}
          <br />
          {entry.meetingOutcome.minutes ? (
            <>
              <b>Minutes:</b> <i>&quot;{entry.meetingOutcome.minutes}&quot;</i>
            </>
          ) : null}
          {entry.meetingOutcome.callReport ? (
            <>
              <br />
              <b>Call report:</b> 📎 {entry.meetingOutcome.callReport}
            </>
          ) : null}
        </Banner>
      ) : null}
    </>
  );
}

/** Cross-sell against an existing merchant, awaiting HoP validation. */
function CrossSellBanner({ state, entry, onOpenMerchant }) {
  const existing = selectClient(state, entry.crossSell.clientId);
  const soldNames = productNames(state, entry.crossSell.existingProducts);
  const proposedNames = productNames(state, entry.productsOfInterest);
  const overlaps = (entry.productsOfInterest || []).some((id) =>
    (entry.crossSell.existingProducts || []).includes(id)
  );

  return (
    <Banner
      tone="warn"
      action={
        existing ? (
          <button type="button" className="btn btn-sm" onClick={() => onOpenMerchant(existing.id)}>
            View existing merchant →
          </button>
        ) : null
      }
    >
      <b>Cross-sell onboarding — pending Head of Products validation.</b>
      <br />
      <b>{entry.prospect}</b> is already a merchant (<b>{entry.crossSell.existingCode || '—'}</b>
      {existing
        ? ` · ${selectCompany(state, existing.companyId)?.code} · owner ${selectUser(state, existing.rmId)?.name}`
        : ''}
      ). This entry keeps that same reference and company — the merchant stays owned by{' '}
      {existing ? selectUser(state, existing.rmId)?.name : 'the original RM'}.
      <br />
      HoP to validate this is a <b>different product</b> than already sold, for a{' '}
      <b>different department/business line</b>.
      <br />
      <span className="small">
        Already sold: {soldNames} &nbsp;·&nbsp; Now proposed: {proposedNames}
      </span>
      <br />
      <span className="small" style={{ color: overlaps ? colors.red : colors.green }}>
        {overlaps
          ? '⚠ Overlaps an already-sold product — HoP should scrutinise.'
          : '✓ No overlap with already-sold products.'}
      </span>
    </Banner>
  );
}

/** Returned to the RM by the Head of Products, with the last return comment. */
function ReturnedBanner({ entry }) {
  const lastReturn = [...(entry.comments || [])].reverse().find((c) => c.type === 'return');
  return (
    <Banner tone="warn">
      <b>Returned to RM by Head of Products.</b>
      {lastReturn ? (
        <>
          {' '}
          Comment: <i>&quot;{lastReturn.text}&quot;</i>
        </>
      ) : null}{' '}
      Address the comment and resubmit for validation.
    </Banner>
  );
}
