import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { useAppState } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** Every group company, with the products it offers and its team. */
export default function CompaniesPage() {
  const state = useAppState();
  const router = useRouter();

  return (
    <>
      <PageMeta
        title="Group Companies"
        description="The Contact Group companies, the products each offers, and their relationship teams."
      />
      <PageHead
        title="Group Companies"
        subtitle="Each company with the products it can offer and its RM team"
      />

      <div className="grid-2">
        {state.companies.map((company) => {
          const products = state.products.filter((p) => p.offeredBy.includes(company.id));
          const rms = state.users.filter((u) => u.companyId === company.id && u.role === 'RM');
          const clients = state.clients.filter((c) => c.companyId === company.id);

          return (
            <Card
              key={company.id}
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(routes.companyDetail(company.id))}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                {company.code}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, margin: '6px 0' }}>{company.name}</div>
              <div className="small muted mb-2">{company.focus}</div>
              <div className="flex" style={{ gap: 18, marginTop: 14 }}>
                <Stat value={products.length} label="Products" />
                <Stat value={rms.length} label="RMs" />
                <Stat value={clients.length} label="Clients" />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div className="small muted">{label}</div>
    </div>
  );
}

export const getServerSideProps = withProtectedPage();
