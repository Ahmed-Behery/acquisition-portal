import Banner from '@/components/common/Banner';
import { PaymentBadge } from '@/components/common/badges';
import { productNames, selectClient } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';

/**
 * AML and duplicate screening shown under the prospect name.
 *
 * An existing merchant is a cross-sell (allowed, routed to HoP); an active pipeline
 * entry or a Good-to-Go item blocks the entry entirely.
 */
export default function ScreeningBanners({ screening, onOpenRecord, onRequestSupport }) {
  const state = useAppState();
  if (!screening.name) return null;

  const { aml, duplicate, crossSell } = screening;

  return (
    <div style={{ marginTop: 8 }}>
      {aml.status === 'review' ? (
        <Banner tone="danger" style={{ margin: 0 }}>
          <b>⚠ AML: potential watchlist match</b> — “{aml.matches.join(', ')}”. Must be cleared by compliance before
          this prospect can proceed.
        </Banner>
      ) : (
        <div className="small" style={{ color: 'var(--green)' }}>
          ✓ AML screening: no watchlist match
        </div>
      )}

      {duplicate && crossSell ? (
        <CrossSellNotice
          state={state}
          name={screening.name}
          duplicate={duplicate}
          onOpenRecord={onOpenRecord}
          onRequestSupport={onRequestSupport}
        />
      ) : null}

      {duplicate && !crossSell ? (
        <Banner
          tone="danger"
          style={{ margin: '6px 0 0' }}
          action={
            <button type="button" className="btn btn-sm" onClick={() => onOpenRecord(duplicate)}>
              View in {duplicate.where} →
            </button>
          }
        >
          <b>Already exists in {duplicate.where}</b> — {duplicate.code || 'no code'} · owner {duplicate.owner} · status{' '}
          {duplicate.status}.
          <br />
          This prospect can&apos;t be entered again.
          {duplicate.status === 'Good to Go'
            ? ' It is on the Good to Go list — use “Re-engage” there to open a fresh cycle.'
            : ''}
        </Banner>
      ) : null}
    </div>
  );
}

/** An existing merchant can still be onboarded for a different department + product. */
function CrossSellNotice({ state, name, duplicate, onOpenRecord, onRequestSupport }) {
  const existing = selectClient(state, duplicate.id);

  return (
    <>
      <Banner
        tone="warn"
        style={{ margin: '6px 0 0' }}
        action={
          <button type="button" className="btn btn-sm" onClick={() => onOpenRecord(duplicate)}>
            View merchant →
          </button>
        }
      >
        <b>
          “{name}” is already a merchant ({duplicate.code || '—'}, owner {duplicate.owner}).
        </b>
        <br />
        <span className="small">
          Onboarded: <b>{existing?.onboardedDate || '—'}</b> &nbsp;·&nbsp; Payment behaviour:{' '}
          {existing ? <PaymentBadge value={existing.paymentBehavior} /> : '—'} &nbsp;·&nbsp; Sold products:{' '}
          {productNames(state, existing?.productsSold)}
        </span>
        <br />
        You may still onboard it for a <b>different department</b> and a <b>different product</b> than already sold. On
        save this is sent to the <b>Head of Products</b> to validate — it will not create a duplicate.
      </Banner>
      <div className="small" style={{ marginTop: 6 }}>
        Need the current RM’s help first?{' '}
        <a
          onClick={() => onRequestSupport('client', duplicate.id)}
          role="button"
          tabIndex={0}
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
        >
          🤝 Request support from {duplicate.owner} to approach this client
        </a>
      </div>
    </>
  );
}

/** The blocking notice repeated just above the Save button. */
export function DuplicateBlockNotice({ screening, onOpenRecord, onRequestSupport }) {
  const { duplicate, blocked, name } = screening;
  if (!blocked || !duplicate) return null;

  return (
    <Banner
      tone="danger"
      style={{ marginTop: 12 }}
      action={
        <>
          <button type="button" className="btn btn-sm" onClick={() => onOpenRecord(duplicate)}>
            Go to record →
          </button>
          {duplicate.page === 'pipeline-detail' ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onRequestSupport('pipeline', duplicate.id)}
            >
              🤝 Request support
            </button>
          ) : null}
        </>
      }
    >
      <b>
        Entry blocked — “{name}” is already in {duplicate.where}
      </b>{' '}
      ({duplicate.code || 'no code'}).
    </Banner>
  );
}
