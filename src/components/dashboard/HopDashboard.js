import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageHead from '@/components/common/PageHead';
import { Kpi, KpiGrid } from '@/components/common/Kpi';
import StaleEntriesBanner from './StaleEntriesBanner';
import { isPendingHop, staleEntries } from '@/domain/pipelineRules';
import { selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoney, firstName } from '@/utils/format';
import { routes } from '@/utils/links';

/** Review queue for the Head of Products. */
export default function HopDashboard({ state, user, today }) {
  const router = useRouter();
  const pending = state.pipeline.filter(isPendingHop);
  const stale = staleEntries(state, today);
  const activeCount = state.pipeline.filter(
    (p) => !['Converted - Active Client', 'Closed - Lost'].includes(p.status)
  ).length;

  return (
    <>
      <PageHead
        title={`Head of Products · ${firstName(user.name)}`}
        subtitle="Approve extension requests, validate Done Deals, and review edits, deletions, and late entries"
      />

      <StaleEntriesBanner staleCount={stale.length} today={today} />

      <KpiGrid>
        <Kpi label="Pending Reviews" value={pending.length} sub="Awaiting your decision" />
        <Kpi label="Active Pipeline (group)" value={activeCount} sub="Total open deals" />
      </KpiGrid>

      <Card title="Pipeline entries pending your review">
        {pending.length === 0 ? (
          <div className="center muted" style={{ padding: 30 }}>
            No reviews pending right now.
          </div>
        ) : (
          pending.map((entry) => (
            <div
              key={entry.id}
              onClick={() => router.push(routes.pipelineDetail(entry.id))}
              style={{
                padding: 14,
                border: '1px solid var(--line)',
                borderRadius: 6,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{entry.prospect}</div>
                  <div className="small muted">
                    {entry.industry} · {selectUser(state, entry.rmId)?.name} (
                    {selectCompany(state, entry.companyId)?.code})
                  </div>
                </div>
                <div style={{ fontWeight: 500 }}>{fmtMoney(entry.value)}</div>
              </div>
              {entry.hopNote ? (
                <div
                  className="small"
                  style={{
                    background: 'var(--surface-alt)',
                    padding: 10,
                    borderRadius: 5,
                    fontStyle: 'italic',
                  }}
                >
                  &quot;{entry.hopNote}&quot;
                </div>
              ) : null}
            </div>
          ))
        )}
      </Card>
    </>
  );
}
