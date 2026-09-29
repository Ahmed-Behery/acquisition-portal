import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { Avatar, Hr } from '@/components/common/misc';
import { selectCompany } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { fmtMoney } from '@/utils/format';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** A single group company: its catalogue, its RMs, and its portfolio. */
export default function CompanyDetailPage() {
  const router = useRouter();
  const state = useAppState();

  const company = selectCompany(state, router.query.id);
  if (!company) return <Card>Company not found.</Card>;

  const products = state.products.filter((p) => p.offeredBy.includes(company.id));
  const rms = state.users.filter((u) => u.companyId === company.id && u.role === 'RM');
  const clients = state.clients.filter((c) => c.companyId === company.id);

  return (
    <>
      <PageMeta title={company.name} description={company.focus} />
      <PageHead eyebrow={company.code} title={company.name} subtitle={company.focus} />

      <div className="grid-2">
        <Card title="Products this company can offer">
          <div className="small muted mb-2">
            All RMs at {company.name} are authorized to offer the following products:
          </div>
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(routes.productDetail(product.id))}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 5,
                marginBottom: 6,
                cursor: 'pointer',
              }}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 500 }}>{product.name}</div>
                  <div className="small muted">{product.category}</div>
                </div>
                <div className="small muted">
                  Refer to <b>{product.contact}</b>
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="RM team">
          {rms.map((rm) => (
            <div key={rm.id} className="flex" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <Avatar name={rm.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{rm.name}</div>
                <div className="small muted">{rm.email}</div>
              </div>
            </div>
          ))}

          <Hr />

          <div className="card-title" style={{ fontSize: 13 }}>
            Active client portfolio
          </div>
          <div className="kpis" style={{ margin: 0 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{clients.length}</div>
              <div className="small muted">Clients</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {fmtMoney(clients.reduce((sum, c) => sum + c.exposure, 0))}
              </div>
              <div className="small muted">Exposure</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export const getServerSideProps = withProtectedPage();
