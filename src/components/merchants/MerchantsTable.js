import { useRouter } from 'next/router';
import { PaymentBadge, StatusBadge } from '@/components/common/badges';
import { EmptyRow, MailLink } from '@/components/common/misc';
import { productNames, selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoney } from '@/utils/format';
import { routes } from '@/utils/links';

const COLUMNS = [
  'Merchant Name',
  'Code',
  'Company',
  'RM',
  'Sold products',
  'Onboarded',
  'Payment',
  'Status',
  'Exposure',
  '',
];

export default function MerchantsTable({ state, rows, currentUserId, onRequestSupport }) {
  const router = useRouter();

  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="tbl">
        <thead>
          <tr>
            {COLUMNS.map((column, i) => (
              <th key={column || `spacer-${i}`} className={column === 'Exposure' ? 'num' : undefined}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={COLUMNS.length}>No merchants match your filters.</EmptyRow>
          ) : (
            rows.map((client) => {
              const rm = selectUser(state, client.rmId);
              const details = [client.industry, client.companySize, client.governorate].filter(Boolean).join(' · ');
              return (
                <tr key={client.id} onClick={() => router.push(routes.clientDetail(client.id))}>
                  <td className="name">
                    {client.name}
                    <div className="small muted">{details}</div>
                  </td>
                  <td className="small" style={{ fontWeight: 500 }}>
                    {client.code}
                  </td>
                  <td>{selectCompany(state, client.companyId)?.code}</td>
                  <td>
                    {rm?.name}
                    <div className="small">
                      <MailLink email={rm?.email} />
                    </div>
                  </td>
                  <td className="small">{productNames(state, client.productsSold)}</td>
                  <td className="small muted">{client.onboardedDate || '—'}</td>
                  <td>
                    <PaymentBadge value={client.paymentBehavior} />
                  </td>
                  <td>
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="num">{fmtMoney(client.exposure)}</td>
                  <td>
                    {client.rmId !== currentUserId ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        title="Ask the responsible RM to support approaching this client"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestSupport(client.id);
                        }}
                      >
                        🤝 Request support
                      </button>
                    ) : (
                      <span className="small muted">your client</span>
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
