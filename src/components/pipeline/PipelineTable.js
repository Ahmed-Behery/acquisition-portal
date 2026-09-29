import { useRouter } from 'next/router';
import { StatusBadge } from '@/components/common/badges';
import { EmptyRow, MailLink } from '@/components/common/misc';
import { selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoney } from '@/utils/format';
import { routes } from '@/utils/links';

const COLUMNS = [
  'Reference',
  'Prospect',
  'Industry',
  'RM',
  'Company',
  'Status',
  'Value',
  'Created',
  'Last update',
  '',
];

export default function PipelineTable({ state, rows, currentUserId, onRequestSupport }) {
  const router = useRouter();

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="tbl">
        <thead>
          <tr>
            {COLUMNS.map((column, i) => (
              <th key={column || `spacer-${i}`} className={column === 'Value' ? 'num' : undefined}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={COLUMNS.length}>No pipeline entries match your filters.</EmptyRow>
          ) : (
            rows.map((entry) => {
              const rm = selectUser(state, entry.rmId);
              return (
                <tr key={entry.id} onClick={() => router.push(routes.pipelineDetail(entry.id))}>
                  <td className="small" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {entry.code || '—'}
                    {entry.amlStatus === 'review' ? (
                      <span title="AML watchlist match" style={{ color: 'var(--red)' }}>
                        {' '}
                        ⚠
                      </span>
                    ) : null}
                  </td>
                  <td className="name">{entry.prospect}</td>
                  <td className="small muted">{entry.industry}</td>
                  <td>
                    {rm?.name}
                    <div className="small">
                      <MailLink email={rm?.email} />
                    </div>
                  </td>
                  <td className="small" style={{ fontWeight: 500 }}>
                    {selectCompany(state, entry.companyId)?.code}
                  </td>
                  <td>
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="num">{fmtMoney(entry.value)}</td>
                  <td className="small muted">{entry.createdAt || '—'}</td>
                  <td className="small muted">{entry.lastUpdate}</td>
                  <td>
                    {entry.rmId !== currentUserId ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        title="Ask the responsible RM to support approaching this client"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestSupport(entry.id);
                        }}
                      >
                        🤝 Request support
                      </button>
                    ) : (
                      <span className="small muted">yours</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
