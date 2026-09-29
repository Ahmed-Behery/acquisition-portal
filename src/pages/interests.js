import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { StatusBadge } from '@/components/common/badges';
import { EmptyCard } from '@/components/common/misc';
import { selectInterestReceived, selectInterestSent, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';

import { withProtectedPage } from '@/server/pageGuard';

/** Interest you've expressed, and interest others have shown in your opportunities. */
export default function InterestsPage() {
  const state = useAppState();
  const user = useCurrentUser();

  const joining = selectInterestSent(state, user.id);
  const received = selectInterestReceived(state, user.id);

  return (
    <>
      <PageMeta
        title="Interests"
        description="Opportunities you have flagged, and stakeholder interest in the ones you initiated."
      />
      <PageHead
        title="Interests"
        subtitle="Opportunities you've expressed interest in joining, and interest others have shown in the opportunities you initiated."
      />

      <h3 style={{ fontSize: 14, margin: '6px 0 10px' }}>
        🎯 Opportunities you&apos;re interested in joining ({joining.length})
      </h3>
      {joining.length === 0 ? (
        <EmptyCard padding={24}>
          You haven&apos;t sent interest on any opportunity yet. Open a pipeline entry and press “I&apos;m
          interested”.
        </EmptyCard>
      ) : (
        joining.map((entry) => <JoiningCard key={entry.id} state={state} entry={entry} user={user} />)
      )}

      <h3 style={{ fontSize: 14, margin: '22px 0 10px' }}>
        📥 Your opportunities with interest received ({received.length})
      </h3>
      {received.length === 0 ? (
        <EmptyCard padding={24}>
          No stakeholders have flagged interest in the opportunities you initiated yet.
        </EmptyCard>
      ) : (
        received.map((entry) => <ReceivedCard key={entry.id} state={state} entry={entry} user={user} />)
      )}
    </>
  );
}

/** Shared shell: clicking anywhere opens the entry. */
function EntryCard({ entry, children }) {
  const router = useRouter();
  return (
    <Card
      style={{ cursor: 'pointer', marginBottom: 10 }}
      onClick={() => router.push(routes.pipelineDetail(entry.id))}
    >
      <div className="flex-between">
        <div>
          <b>{entry.prospect}</b>{' '}
          <span className="small muted">
            · {entry.code || ''} · {entry.industry}
          </span>
        </div>
        <div>
          <StatusBadge status={entry.status} />
        </div>
      </div>
      {children}
    </Card>
  );
}

function JoiningCard({ state, entry, user }) {
  const mine = entry.interestedFlags.find((f) => f.userId === user.id);
  const entrant = selectUser(state, entry.enteredBy || entry.rmId);
  const rm = selectUser(state, entry.rmId);

  return (
    <EntryCard entry={entry}>
      <div className="small" style={{ marginTop: 6 }}>
        Initiated by <b>{entrant?.name}</b> · RM {rm?.name} · visit {entry.visitDate || 'TBD'}
        {mine?.message ? (
          <div className="muted" style={{ marginTop: 3 }}>
            Your message: <i>&quot;{mine.message}&quot;</i>
          </div>
        ) : null}
        <div style={{ marginTop: 3 }}>
          {mine?.contacted ? (
            <span style={{ color: 'var(--green)' }}>
              ✓ The initiator has marked they contacted you ({mine.contactedAt || ''})
            </span>
          ) : (
            <span style={{ color: 'var(--orange)' }}>
              ⏱ Awaiting contact{mine?.dueDate ? ` — initiator due by ${mine.dueDate}` : ''}
            </span>
          )}
        </div>
      </div>
    </EntryCard>
  );
}

function ReceivedCard({ state, entry, user }) {
  const actions = useActions();
  const others = entry.interestedFlags.filter((f) => f.userId !== user.id);
  const canMark = entry.enteredBy === user.id || entry.rmId === user.id;
  const today = state.today;

  return (
    <EntryCard entry={entry}>
      <div className="small" style={{ marginTop: 6 }}>
        {others.map((flag) => {
          const overdue = flag.dueDate && today > flag.dueDate;
          return (
            <div key={flag.userId} style={{ marginTop: 5 }}>
              <b>{flag.name || selectUser(state, flag.userId)?.name || 'Unknown'}</b>{' '}
              <span className="muted">({flag.role || selectUser(state, flag.userId)?.role || ''})</span> is interested
              {flag.message ? (
                <>
                  : <i>&quot;{flag.message}&quot;</i>
                </>
              ) : null}
              <div style={{ marginTop: 2 }}>
                {flag.contacted ? (
                  <span style={{ color: 'var(--green)' }}>✓ Contacted {flag.contactedAt || ''}</span>
                ) : overdue ? (
                  <span style={{ color: 'var(--red)' }}>
                    ⚠ Overdue — due {flag.dueDate}
                    {flag.escalated ? ' · escalated to manager' : ''}
                  </span>
                ) : (
                  <span style={{ color: 'var(--orange)' }}>⏱ Contact by {flag.dueDate || '—'}</span>
                )}
                {!flag.contacted && canMark ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    style={{ marginLeft: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.interest.markContacted(entry.id, flag.userId);
                    }}
                  >
                    Mark contacted
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </EntryCard>
  );
}

export const getServerSideProps = withProtectedPage();
