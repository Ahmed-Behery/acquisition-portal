import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import DefinitionList from '@/components/common/DefinitionList';
import { Avatar } from '@/components/common/misc';
import { selectCompany, selectProduct } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** Product sheet: what it is, who to call, and which bundles include it. */
export default function ProductDetailPage() {
  const router = useRouter();
  const state = useAppState();

  const product = selectProduct(state, router.query.id);
  if (!product) return <Card>Product not found.</Card>;

  const bundles = state.bundles.filter((b) => b.products.includes(product.id));

  return (
    <>
      <PageMeta title={product.name} description={product.desc} />
      <PageHead eyebrow={product.category.toUpperCase()} title={product.name} />

      <div className="grid-2">
        <Card title="Product information">
          <DefinitionList
            items={[
              { term: 'Category', value: product.category },
              { term: 'Description', value: product.desc, valueStyle: { fontWeight: 400 } },
              {
                term: 'Offered by',
                value: product.offeredBy.map((id) => selectCompany(state, id)?.name).join(', '),
              },
            ]}
          />
        </Card>

        <Card title="Who to contact for more information">
          <div className="flex" style={{ marginTop: 10 }}>
            <Avatar name={product.contact} size={50} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{product.contact}</div>
              <div className="small muted">{product.email}</div>
            </div>
          </div>
          <Banner tone="info" className="mt-2">
            For referrals or detailed product information, reach out to {product.contact} directly.
          </Banner>
        </Card>
      </div>

      <Card className="mt-2" title="Bundles that include this product">
        {bundles.length === 0 ? (
          <div className="muted small">This product is not currently part of any bundle.</div>
        ) : (
          bundles.map((bundle) => (
            <div
              key={bundle.id}
              onClick={() => router.push(routes.bundleDetail(bundle.id))}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 5,
                marginBottom: 6,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 500 }}>{bundle.name}</div>
              <div className="small muted">{bundle.desc}</div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}

export const getServerSideProps = withProtectedPage();
