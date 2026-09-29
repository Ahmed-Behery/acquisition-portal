import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import DefinitionList from '@/components/common/DefinitionList';
import { StatusBadge } from '@/components/common/badges';
import { EmptyCard, MailLink } from '@/components/common/misc';
import { productNames, selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoney } from '@/utils/format';
import { routes } from '@/utils/links';

/** Released merchants, shown as cards. */
export function GoodToGoMerchants({ state, clients, canReengage, onReengage }) {
  const router = useRouter();

  if (clients.length === 0) return <EmptyCard>No merchants match your filters.</EmptyCard>;

  return (
    <div className="grid-2">
      {clients.map((client) => {
        const rm = selectUser(state, client.rmId);
        return (
          <Card
            key={client.id}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(routes.clientDetail(client.id))}
          >
            <div className="flex-between mb-2">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{client.name}</div>
                <div className="small muted">{client.industry}</div>
              </div>
              <StatusBadge status={client.status} />
            </div>
            <DefinitionList
              style={{ fontSize: 12 }}
              items={[
                { term: 'Originating', value: `${selectCompany(state, client.companyId)?.code} · ${rm?.name}` },
                { term: 'RM Email', value: <MailLink email={rm?.email} />, valueStyle: { fontWeight: 400 } },
                { term: 'Historic Exposure', value: fmtMoney(client.exposure) },
                { term: 'Products held', value: productNames(state, client.productsSold) },
              ]}
            />
            {canReengage ? (
              <div style={{ marginTop: 12, textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReengage(client.id);
                  }}
                >
                  ↻ Re-engage
                </button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

/** Pipeline entries that lapsed onto the Good to Go list. */
export function GoodToGoPipeline({ state, entries, canReengage, onReengage }) {
  const router = useRouter();

  if (entries.length === 0) return <EmptyCard>No pipeline entries match your filters.</EmptyCard>;

  const open = (id) => router.push(routes.pipelineDetail(id));

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Prospect</th>
            <th>Original RM</th>
            <th>Company</th>
            <th className="num">Value</th>
            <th>Last update</th>
            {canReengage ? <th>Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const rm = selectUser(state, entry.rmId);
            return (
              <tr key={entry.id}>
                <td className="name" onClick={() => open(entry.id)} style={{ cursor: 'pointer' }}>
                  {entry.prospect}
                  <div className="small muted">{entry.industry}</div>
                </td>
                <td onClick={() => open(entry.id)} style={{ cursor: 'pointer' }}>
                  {rm?.name}
                  <div className="small">
                    <MailLink email={rm?.email} />
                  </div>
                </td>
                <td onClick={() => open(entry.id)} style={{ cursor: 'pointer' }}>
                  {selectCompany(state, entry.companyId)?.code}
                </td>
                <td className="num" onClick={() => open(entry.id)} style={{ cursor: 'pointer' }}>
                  {fmtMoney(entry.value)}
                </td>
                <td className="small muted" onClick={() => open(entry.id)} style={{ cursor: 'pointer' }}>
                  {entry.lastUpdate}
                </td>
                {canReengage ? (
                  <td>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onReengage(entry.id)}>
                      ↻ Re-engage
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
