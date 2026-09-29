import Card from '@/components/common/Card';
import DefinitionList from '@/components/common/DefinitionList';
import { PaymentBadge, StatusBadge } from '@/components/common/badges';
import { Hr, MailLink } from '@/components/common/misc';
import { productNames, selectCompany, selectUser } from '@/domain/selectors';
import { fmtMoneyFull } from '@/utils/format';

/** The merchant's own record. */
export function ClientInfoCard({ state, client }) {
  const company = selectCompany(state, client.companyId);
  return (
    <Card title="Client information">
      <DefinitionList
        items={[
          { term: 'Legal Name', value: client.name },
          { term: 'Industry', value: client.industry },
          { term: 'Company size', value: client.companySize || '—' },
          { term: 'Governorate', value: client.governorate || '—' },
          { term: 'Client Code', value: client.code },
          { term: 'Originating Company', value: company?.name },
          { term: 'Onboarded', value: client.onboardedDate || '—' },
          { term: 'Payment behaviour', value: <PaymentBadge value={client.paymentBehavior} /> },
          { term: 'Status', value: <StatusBadge status={client.status} /> },
        ]}
      />
    </Card>
  );
}

/** Who owns the relationship, and the actions available on it. */
export function ClientRelationshipCard({ state, client, canRelease, onRelease }) {
  const rm = selectUser(state, client.rmId);
  return (
    <Card title="Relationship">
      <DefinitionList
        items={[
          { term: 'Primary RM', value: rm?.name },
          {
            term: 'RM Phone',
            value: (
              <>
                📇 {rm?.phone || '—'} <span className="small muted">(from contact DB)</span>
              </>
            ),
            valueStyle: { fontWeight: 400 },
          },
          { term: 'RM Email', value: <MailLink email={rm?.email} />, valueStyle: { fontWeight: 400 } },
          { term: 'Current Exposure', value: fmtMoneyFull(client.exposure) },
          { term: 'Sold products', value: productNames(state, client.productsSold) },
        ]}
      />
      {canRelease ? (
        <>
          <Hr />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Actions</div>
          <button type="button" className="btn" onClick={onRelease}>
            Move to Good to Go
          </button>
        </>
      ) : null}
    </Card>
  );
}
