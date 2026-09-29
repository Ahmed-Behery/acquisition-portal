import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import { StatusBadge } from '@/components/common/badges';
import { ClientInfoCard, ClientRelationshipCard } from '@/components/merchants/ClientCards';
import { CrossSellInProgress, SuggestedCrossSell } from '@/components/merchants/CrossSellPanels';
import { ROLES } from '@/constants/roles';
import { selectClient, selectCompany, selectProduct, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState, useCurrentUser } from '@/hooks/useAppStore';
import { dialogs } from '@/utils/dialogs';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** Merchant profile, including cross-company alignment and cross-sell context. */
export default function ClientDetailPage() {
  const router = useRouter();
  const state = useAppState();
  const user = useCurrentUser();
  const actions = useActions();

  const client = selectClient(state, router.query.id);
  if (!client) return <Card>Client not found.</Card>;

  const rm = selectUser(state, client.rmId);
  const company = selectCompany(state, client.companyId);
  const isMyClient = client.rmId === user.id;
  const isOtherCompanyRm = user.role === ROLES.RM && user.companyId !== client.companyId;

  // Cross-sell entries opened against this merchant.
  const crossSellEntries = state.pipeline.filter(
    (p) => p.crossSell && p.crossSell.clientId === client.id && p.status !== 'Closed - Lost'
  );
  const showSuggestions = user.role === ROLES.RM && user.companyId === client.companyId;

  return (
    <>
      <PageMeta title={client.name} description={`${client.industry} · ${company?.name} · client code ${client.code}`} />
      <PageHead
        title={client.name}
        subtitle={
          <>
            {client.industry} · {company?.name} · Code <b>{client.code}</b>
          </>
        }
        actions={<StatusBadge status={client.status} />}
      />

      {isOtherCompanyRm ? (
        <Banner
          tone="info"
          action={
            <button type="button" className="btn btn-primary" onClick={() => actions.client.requestAlignment(client.id)}>
              Request Alignment
            </button>
          }
        >
          <b>Cross-company alignment required</b>
          <br />
          This client is managed by <b>{rm?.name}</b> at {company?.name}. Before approaching this client to offer your
          services, you must request alignment with the existing RM.
        </Banner>
      ) : null}

      {client.status === 'Good to Go' ? (
        <Banner
          tone="info"
          action={
            user.role === ROLES.RM ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => dialogs.alert('Re-engagement request sent to Head of Products for approval.')}
              >
                Request Re-engagement
              </button>
            ) : null
          }
        >
          <b>Released to Good to Go list.</b> Available for any RM in the group to re-engage. Re-engagement requires
          Head of Products approval.
        </Banner>
      ) : null}

      <div className="grid-2">
        <ClientInfoCard state={state} client={client} />
        <ClientRelationshipCard
          state={state}
          client={client}
          canRelease={isMyClient && client.status !== 'Good to Go'}
          onRelease={() => actions.client.moveClientToGoodToGo(client.id)}
        />
      </div>

      <Card className="mt-2" title="Products sold">
        {client.productsSold.map((productId) => {
          const product = selectProduct(state, productId);
          if (!product) return null;
          return (
            <div
              key={productId}
              className="pill"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(routes.productDetail(productId))}
            >
              {product.name} <span style={{ opacity: 0.7 }}>· {product.category}</span>
            </div>
          );
        })}
      </Card>

      <CrossSellInProgress state={state} client={client} entries={crossSellEntries} />

      {showSuggestions ? <SuggestedCrossSell state={state} client={client} /> : null}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
