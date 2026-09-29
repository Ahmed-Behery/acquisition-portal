import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageHead from '@/components/common/PageHead';
import { Kpi, KpiGrid } from '@/components/common/Kpi';
import { StatusBadge } from '@/components/common/badges';
import { CardLink } from '@/components/common/misc';
import StaleEntriesBanner from './StaleEntriesBanner';
import ExposureByCompany from './ExposureByCompany';
import { selectCompany, selectUnreadCount, selectUser } from '@/domain/selectors';
import { staleEntries } from '@/domain/pipelineRules';
import { fmtMoney, firstName } from '@/utils/format';
import { routes } from '@/utils/links';

const PREVIEW_ROWS = 6;

/** Group-wide view for CEO / MD / Admin. */
export default function LeaderDashboard({ state, user, today }) {
  const router = useRouter();

  const metrics = useMemo(() => {
    const totalExposure = state.clients.reduce((sum, c) => sum + c.exposure, 0);
    const activePipe = state.pipeline.filter(
      (p) => !['Converted - Active Client', 'Closed - Lost'].includes(p.status)
    );
    return {
      totalExposure,
      activePipe,
      pipeValue: activePipe.reduce((sum, p) => sum + p.value, 0),
      goodToGoCount:
        state.clients.filter((c) => c.status === 'Good to Go').length +
        state.pipeline.filter((p) => p.status === 'Good to Go').length,
    };
  }, [state.clients, state.pipeline]);

  const unread = selectUnreadCount(state, user.id);
  const stale = staleEntries(state, today);

  return (
    <>
      <PageHead
        title={`Welcome, ${firstName(user.name)}`}
        subtitle="Group-wide view across all Contact Group companies"
      />

      <StaleEntriesBanner staleCount={stale.length} today={today} />

      <KpiGrid>
        <Kpi
          label="Total Group Exposure"
          value={fmtMoney(metrics.totalExposure)}
          sub={`Across ${state.clients.length} active relationships`}
        />
        <Kpi
          label="Active Pipeline"
          value={metrics.activePipe.length}
          unit="deals"
          sub={`${fmtMoney(metrics.pipeValue)} total value`}
        />
        <Kpi label="Good to Go List" value={metrics.goodToGoCount} sub="Available for re-engagement" />
        <Kpi
          label="Unread Alerts"
          value={unread}
          sub={<CardLink href={routes.inbox()}>View inbox →</CardLink>}
        />
      </KpiGrid>

      <div className="two-col">
        <Card title="Active pipeline — group-wide" action={<CardLink href={routes.pipeline()}>View all →</CardLink>}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>RM</th>
                <th>Status</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {metrics.activePipe.slice(0, PREVIEW_ROWS).map((entry) => (
                <tr key={entry.id} onClick={() => router.push(routes.pipelineDetail(entry.id))}>
                  <td className="name">
                    {entry.prospect}
                    <div className="small muted">{entry.industry}</div>
                  </td>
                  <td>
                    {selectUser(state, entry.rmId)?.name}
                    <div className="small muted">{selectCompany(state, entry.companyId)?.code}</div>
                  </td>
                  <td>
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="num">{fmtMoney(entry.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <ExposureByCompany
          companies={state.companies}
          clients={state.clients}
          totalExposure={metrics.totalExposure}
        />
      </div>
    </>
  );
}
