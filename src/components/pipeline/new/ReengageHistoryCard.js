import Card from '@/components/common/Card';
import DefinitionList from '@/components/common/DefinitionList';
import { Hr } from '@/components/common/misc';
import { selectUser } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { fmtMoney, fmtMoneyFull } from '@/utils/format';

const RECENT_COMMENTS = 5;

/** The prior record of a Good-to-Go prospect being re-engaged. */
export default function ReengageHistoryCard({ reengage }) {
  const state = useAppState();
  const { history, name } = reengage;
  if (!history) return null;

  return (
    <Card
      style={{ maxWidth: 820, marginBottom: 16, borderLeft: '3px solid var(--primary)' }}
      title={`📜 Prospect history — ${name}`}
    >
      <div className="small muted mb-2">
        This company was released to the Good to Go list. Its prior record is shown for context; the fresh opportunity
        below starts a new cycle.
      </div>

      <DefinitionList
        style={{ fontSize: 12.5 }}
        items={[
          { term: 'Previous reference', value: history.originalCode || '—' },
          { term: 'Originally with', value: `${history.originalRm} · ${history.originalCompany}` },
          { term: 'Industry', value: history.industry },
          { term: 'Last known value', value: fmtMoneyFull(history.value) },
          { term: 'Products of interest', value: history.products.length ? history.products.join(', ') : '—' },
          history.priorMerchantCode && {
            term: 'Was a merchant',
            value: `${history.priorMerchantCode}${
              history.priorExposure != null ? ' · exposure ' + fmtMoney(history.priorExposure) : ''
            }`,
          },
          { term: 'First entered', value: history.createdAt },
          { term: 'Last activity', value: history.lastUpdate },
          {
            term: 'Prior summary',
            value: history.summary || '—',
            valueStyle: { fontWeight: 400, fontStyle: 'italic' },
          },
        ]}
      />

      {history.comments.length ? (
        <>
          <Hr />
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Prior activity log</div>
          {history.comments.slice(-RECENT_COMMENTS).map((comment, index) => (
            <div
              key={`${comment.at}-${index}`}
              className="small"
              style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}
            >
              <b>{selectUser(state, comment.by)?.name || comment.role || 'System'}</b>{' '}
              <span className="muted">· {comment.at || ''}</span>
              <br />
              {comment.text || ''}
            </div>
          ))}
        </>
      ) : null}
    </Card>
  );
}
