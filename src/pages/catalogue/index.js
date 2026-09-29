import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import Banner from '@/components/common/Banner';
import { Hr } from '@/components/common/misc';
import { selectCompany, selectPipelineEntry } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState } from '@/hooks/useAppStore';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/**
 * The group-wide product catalogue.
 * Saving a pipeline entry lands here, with a one-off prompt to consider cross-sell.
 */
export default function CataloguePage() {
  const router = useRouter();
  const state = useAppState();
  const actions = useActions();
  const [justCreatedId, setJustCreatedId] = useState(null);

  // The "just created" flag is consumed once so the banner does not reappear when
  // the catalogue is revisited.
  useEffect(() => {
    const { id } = actions.pipeline.consumeJustCreated();
    if (id) setJustCreatedId(id);
    // Runs once per visit to this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const justCreated = justCreatedId ? selectPipelineEntry(state, justCreatedId) : null;

  return (
    <>
      <PageMeta
        title="Product Catalogue"
        description="Every product offered across the Contact Group, with its referral contact."
      />
      <PageHead
        title="Product Catalogue"
        subtitle="All products offered across the group, with referral contacts"
        actions={
          justCreated ? (
            <button
              type="button"
              className="btn"
              onClick={() => router.push(routes.pipelineDetail(justCreated.id))}
            >
              View pipeline entry →
            </button>
          ) : null
        }
      />

      {justCreated ? (
        <Banner tone="success" className="mb-2">
          <b>
            Pipeline entry &quot;{justCreated.prospect}&quot; saved and sent to the Head of Products for validation.
          </b>{' '}
          As a Contact Group RM you can introduce all corporate products across the group — review the catalogue below
          and pick the products that best fit {justCreated.prospect}.
        </Banner>
      ) : null}

      <div className="grid-3">
        {state.products.map((product) => (
          <Card
            key={product.id}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(routes.productDetail(product.id))}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.06em' }}>
              {product.category.toUpperCase()}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, margin: '6px 0' }}>{product.name}</div>
            <div className="small muted mb-2">{product.desc}</div>
            <Hr />
            <div className="small">
              <div style={{ marginBottom: 4 }}>
                <b>Available from:</b>{' '}
                {product.offeredBy.map((id) => selectCompany(state, id)?.code).join(', ')}
              </div>
              <div>
                <b>Contact:</b> {product.contact}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export const getServerSideProps = withProtectedPage();
