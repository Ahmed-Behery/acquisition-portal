import Link from 'next/link';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import { routes } from '@/utils/links';
import { withProtectedPage } from '@/server/pageGuard';

/** Bundles are intentionally empty for now — see the copy below. */
export default function BundlesPage() {
  return (
    <>
      <PageMeta
        title="Bundles"
        description="Pre-packaged combinations of Contact Group products."
      />
      <PageHead title="Bundles" subtitle="Pre-packaged combinations of products available across the group" />

      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 34, opacity: 0.4 }}>◫</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>No bundles configured yet</div>
        <div
          className="small muted"
          style={{ marginTop: 6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}
        >
          Bundles are intentionally empty for now. After creating a pipeline entry, RMs are taken to the{' '}
          <Link href={routes.catalogue()} style={{ color: 'var(--primary)' }}>
            Product Catalogue
          </Link>{' '}
          to identify cross-sell opportunities. An Admin can re-introduce bundles later.
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = withProtectedPage();
