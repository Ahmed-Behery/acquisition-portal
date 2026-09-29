import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageHead from '@/components/common/PageHead';
import { Kpi, KpiGrid } from '@/components/common/Kpi';
import { StatusBadge } from '@/components/common/badges';
import { CardLink, EmptyRow } from '@/components/common/misc';
import DraftsModal from '@/components/pipeline/DraftsModal';
import { isActivePipe } from '@/domain/pipelineRules';
import { selectCompany } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useDrafts } from '@/hooks/useDrafts';
import { fmtMoney, firstName } from '@/utils/format';
import { routes } from '@/utils/links';

const TOP_CLIENTS = 5;

/** Personal book view for an RM or directory employee. */
export default function RmDashboard({ state, user }) {
  const router = useRouter();
  const actions = useActions();
  const drafts = useDrafts(user.id);
  const [draftsOpen, setDraftsOpen] = useState(false);

  const book = useMemo(() => {
    const myClients = state.clients.filter((c) => c.rmId === user.id);
    // Only the prospects this RM personally entered or owns — their own exposure.
    const myPipe = state.pipeline.filter(
      (p) => (p.rmId === user.id || p.enteredBy === user.id) && isActivePipe(p)
    );
    return {
      myClients,
      myPipe,
      exposure: myClients.reduce((sum, c) => sum + c.exposure, 0),
      topClients: [...myClients].sort((a, b) => b.exposure - a.exposure).slice(0, TOP_CLIENTS),
      goodToGoCount: myClients.filter((c) => c.status === 'Good to Go').length,
      pipeValue: myPipe.reduce((sum, p) => sum + p.value, 0),
    };
  }, [state.clients, state.pipeline, user.id]);

  const companyName = user.companyId ? selectCompany(state, user.companyId)?.name : null;
  const subtitleParts = [
    companyName,
    user.role === 'Employee' ? user.jobTitle || 'Employee' : null,
    'Your book at a glance',
  ].filter(Boolean);

  return (
    <>
      <PageHead
        title={`Welcome, ${firstName(user.name)}`}
        subtitle={subtitleParts.join(' · ')}
        actions={
          <>
            {drafts.count ? (
              <button type="button" className="btn" onClick={() => setDraftsOpen(true)}>
                📝 Drafts <span className="pill-count">{drafts.count}</span>
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => actions.pipeline.startNewEntry()}>
              + New pipeline entry
            </button>
          </>
        }
      />

      <KpiGrid>
        <Kpi
          label="My Clients"
          value={book.myClients.length}
          sub={`${book.goodToGoCount} on Good to Go`}
        />
        <Kpi
          label="My Exposure"
          value={fmtMoney(book.exposure)}
          sub={`Across ${book.myClients.length} client${book.myClients.length === 1 ? '' : 's'}`}
        />
        <Kpi label="Open Pipeline" value={book.myPipe.length} sub={`${fmtMoney(book.pipeValue)} value`} />
      </KpiGrid>

      <div className="two-col">
        <Card title="My pipeline" action={<CardLink href={routes.pipeline()}>View all →</CardLink>}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Status</th>
                <th className="num">Value</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {book.myPipe.length === 0 ? (
                <EmptyRow colSpan={4} padding={30}>
                  No pipeline entries yet.{' '}
                  <a
                    onClick={() => actions.pipeline.startNewEntry()}
                    style={{ color: 'var(--primary)', cursor: 'pointer' }}
                  >
                    Create one →
                  </a>
                </EmptyRow>
              ) : (
                book.myPipe.map((entry) => (
                  <tr key={entry.id} onClick={() => router.push(routes.pipelineDetail(entry.id))}>
                    <td className="name">
                      {entry.prospect}
                      <div className="small muted">{entry.industry}</div>
                    </td>
                    <td>
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="num">{fmtMoney(entry.value)}</td>
                    <td className="muted small">{entry.lastUpdate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card title="My top clients" action={<CardLink href={routes.ledger()}>View all →</CardLink>}>
          {book.topClients.map((client) => (
            <div
              key={client.id}
              onClick={() => router.push(routes.clientDetail(client.id))}
              style={{ padding: '11px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{client.name}</div>
                  <div className="small muted">
                    {client.industry} · <StatusBadge status={client.status} />
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{fmtMoney(client.exposure)}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <DraftsModal open={draftsOpen} onClose={() => setDraftsOpen(false)} drafts={drafts} />
    </>
  );
}
