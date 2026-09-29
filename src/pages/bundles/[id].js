import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import { Avatar } from '@/components/common/misc';
import { selectBundle, selectCompany, selectProduct } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** A bundle and the products it combines. */
export default function BundleDetailPage() {
  const router = useRouter();
  const state = useAppState();

  const bundle = selectBundle(state, router.query.id);
  if (!bundle) return <Card>Bundle not found.</Card>;

  return (
    <>
      <PageMeta title={bundle.name} description={bundle.desc} />
      <PageHead title={bundle.name} subtitle={bundle.desc} />

      <div className="grid-2">
        <Card title="Component products">
          {bundle.products.map((productId) => {
            const product = selectProduct(state, productId);
            if (!product) return null;
            return (
              <div
                key={productId}
                onClick={() => router.push(routes.productDetail(productId))}
                style={{
                  padding: 12,
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                    <div className="small muted">
                      {product.category} · {product.desc}
                    </div>
                  </div>
                  <div className="small muted">
                    {product.offeredBy.map((id) => selectCompany(state, id)?.code).join(', ')}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <Card title="Bundle contact">
          <div className="flex" style={{ marginTop: 10 }}>
            <Avatar name={bundle.contact} size={50} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{bundle.contact}</div>
              <div className="small muted">{bundle.email}</div>
            </div>
          </div>
          <Banner tone="info" className="mt-2">
            For bundle pricing, configuration questions, or referrals, contact {bundle.contact} directly.
          </Banner>
        </Card>
      </div>
    </>
  );
}

export const getServerSideProps = withProtectedPage();
