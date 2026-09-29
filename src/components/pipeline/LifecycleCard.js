import { useState } from 'react';
import Card from '@/components/common/Card';
import DefinitionList from '@/components/common/DefinitionList';
import { StatusBadge } from '@/components/common/badges';
import { Hr, MailLink } from '@/components/common/misc';
import HopReviewActions from './HopReviewActions';
import { PIPELINE_STAGES, STAGES_REQUIRING_HOP } from '@/constants/pipeline';
import { canExpressInterest } from '@/domain/notifications';
import { selectCompany, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';

/**
 * Ownership, the stage control, and every action gated on who is looking:
 * the entrant manages the entry, the Head of Products reviews it, and leadership
 * can register interest.
 */
export default function LifecycleCard({
  state,
  entry,
  user,
  permissions,
  onRequestStage,
  onEdit,
  onExpressInterest,
}) {
  const actions = useActions();
  const [stage, setStage] = useState(entry.status);

  const rm = selectUser(state, entry.rmId);
  const entrant = selectUser(state, entry.enteredBy || entry.rmId);
  const company = selectCompany(state, entry.companyId);
  const alreadyFlagged = entry.interestedFlags?.some((f) => f.userId === user.id);

  const applyStage = () => {
    if (stage === entry.status) return;
    // The last two stages are gated: they open a modal instead of applying directly.
    if (STAGES_REQUIRING_HOP.includes(stage)) {
      onRequestStage(stage);
      return;
    }
    actions.pipeline.applyStageChange(entry.id, stage);
  };

  const showLeadership =
    canExpressInterest(user) && !permissions.isClosed && !permissions.isLocked && !permissions.isGoodToGo;

  return (
    <Card title="Lifecycle">
      <DefinitionList
        items={[
          { term: 'Created', value: entry.createdAt || '—' },
          { term: 'Last update', value: entry.lastUpdate },
          {
            term: 'Entered by',
            value: (
              <>
                {entrant?.name}
                <div className="small">
                  <MailLink email={entrant?.email} />
                </div>
              </>
            ),
          },
          {
            term: 'Responsible RM',
            value: (
              <>
                {rm?.name}
                <div className="small">
                  📇 {rm?.phone || '—'} · <MailLink email={rm?.email} />{' '}
                  <span className="muted">(from contact DB)</span>
                </div>
              </>
            ),
          },
          { term: 'Company', value: company?.name },
          { term: 'Current status', value: <StatusBadge status={entry.status} /> },
        ]}
      />

      <Hr />

      {permissions.canChangeStatus ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Update status</div>
          <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
            <select
              aria-label="Pipeline stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: '1px solid var(--line-strong)',
                borderRadius: 5,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              {PIPELINE_STAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={applyStage}>
              Apply
            </button>
          </div>
          <div className="hint small muted" style={{ marginTop: 6 }}>
            Stages &quot;Extend Negotiation&quot; and &quot;Done Deal&quot; require Head of Products approval and
            supporting details.
          </div>
        </>
      ) : null}

      {permissions.isLocked ? (
        <div className="small muted">Entry is locked while a Head of Products review is pending.</div>
      ) : null}

      {permissions.isPendingHop && permissions.isHop ? (
        <>
          <Hr />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Head of Products review</div>
          <HopReviewActions entry={entry} />
        </>
      ) : null}

      {permissions.canEdit ? (
        <>
          <Hr />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Manage entry</div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
            {entry.status === 'Returned to RM' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => actions.pipeline.resubmitValidation(entry.id)}
              >
                Resubmit for validation
              </button>
            ) : null}
            <button type="button" className="btn" onClick={onEdit}>
              Edit details
            </button>
            <button type="button" className="btn btn-danger" onClick={() => actions.pipeline.requestDelete(entry.id)}>
              Request delete
            </button>
          </div>
          <div className="hint small muted" style={{ marginTop: 6 }}>
            Edit and delete require Head of Products approval before they take effect. Only the person who entered this
            record ({entrant?.name}) can request edits or deletion.
          </div>
        </>
      ) : null}

      {showLeadership ? (
        <>
          <Hr />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Leadership engagement</div>
          {alreadyFlagged ? (
            <>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="small" style={{ color: 'var(--green)', fontWeight: 500 }}>
                  ✓ You&apos;ve flagged this as a potential client
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => actions.interest.unflagInterest(entry.id)}
                >
                  Unflag
                </button>
              </div>
              <div className="hint small muted" style={{ marginTop: 6 }}>
                The RM has been notified to coordinate with you before the visit on {entry.visitDate || '—'}.
              </div>
            </>
          ) : (
            <>
              <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-success" onClick={() => onExpressInterest(false)}>
                  🎯 I&apos;m interested
                </button>
                <button type="button" className="btn" onClick={() => onExpressInterest(true)}>
                  👥 Delegate to a team member
                </button>
              </div>
              <div className="hint small muted" style={{ marginTop: 6 }}>
                Pick your related product (added to the pipeline). Delegating notifies your team member to open it and
                tells the RM to call them; you keep visibility of the updates.
              </div>
            </>
          )}
        </>
      ) : null}

      {entry.pendingEdit && permissions.isHop ? <ProposedChanges pendingEdit={entry.pendingEdit} /> : null}
    </Card>
  );
}

/** Field-by-field diff of an edit awaiting approval. */
function ProposedChanges({ pendingEdit }) {
  return (
    <>
      <Hr />
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Proposed changes</div>
      <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 5, fontSize: 12.5 }}>
        {Object.entries(pendingEdit.changes).map(([field, value]) => (
          <div key={field} style={{ padding: '4px 0', borderBottom: '1px dashed var(--line)' }}>
            <div
              className="small muted"
              style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}
            >
              {field}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--ink-muted)' }}>
                {pendingEdit.previous[field] || '—'}
              </span>
              <span style={{ color: 'var(--green)' }}>→</span>
              <span style={{ fontWeight: 500 }}>{value || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
