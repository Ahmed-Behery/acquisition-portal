import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/badges';
import { productNames, selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoney } from '@/utils/format';
import { routes } from '@/utils/links';

const MAX_SUGGESTIONS = 4;

/** Additional onboardings opened against this same merchant (cross-sell). */
export function CrossSellInProgress({ state, client, entries }) {
  const router = useRouter();
  if (!entries.length) return null;

  const rmName = selectUser(state, client.rmId)?.name;

  return (
    <Card
      className="mt-2"
      style={{ borderLeft: '3px solid var(--primary)' }}
      title="Additional onboarding in progress"
      titleNote={`· cross-sell against this merchant (${entries.length})`}
    >
      <div className="small muted mb-2">
        These use the same merchant reference (<b>{client.code}</b>) and company (
        <b>{selectCompany(state, client.companyId)?.code}</b>). This merchant stays owned by <b>{rmName}</b>; each entry
        below is a new opportunity for a different product, validated by the Head of Products.
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Reference</th>
            <th>RM on the new deal</th>
            <th>Products proposed</th>
            <th className="num">Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} onClick={() => router.push(routes.pipelineDetail(entry.id))} style={{ cursor: 'pointer' }}>
              <td className="small" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {entry.code || '—'}
              </td>
              <td>{selectUser(state, entry.rmId)?.name || '—'}</td>
              <td className="small">{productNames(state, entry.productsOfInterest)}</td>
              <td className="num">{fmtMoney(entry.value)}</td>
              <td>
                <StatusBadge status={entry.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** Products the client doesn't hold, available from sister companies. */
export function SuggestedCrossSell({ state, client }) {
  const owned = new Set(client.productsSold);
  const suggestions = state.products
    .filter((p) => !owned.has(p.id) && !p.offeredBy.includes(client.companyId))
    .slice(0, MAX_SUGGESTIONS);

  return (
    <Card className="mt-2" title="Suggested cross-sell from other group companies">
      <div className="small muted mb-2">
        Products this client doesn&apos;t currently hold, available from your sister companies.
      </div>
      {suggestions.map((product) => (
        <div
          key={product.id}
          className="flex-between"
          style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 5, marginBottom: 6 }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{product.name}</div>
            <div className="small muted">
              {product.category} · Available from{' '}
              {product.offeredBy.map((id) => selectCompany(state, id)?.code).join(', ')}
            </div>
          </div>
          <div className="small muted">
            Refer to <b>{product.contact}</b>
          </div>
        </div>
      ))}
    </Card>
  );
}
