import Link from 'next/link';
import PageMeta from '@/components/common/PageMeta';
import { routes } from '@/utils/links';

/** Stands alone: a missing URL may be hit before the session is known. */
export default function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page not found" />
      <div className="login">
        <div className="login-card" style={{ width: 420, textAlign: 'center' }}>
          <div className="login-brand">Page not found</div>
          <div className="login-sub">Contact Group · Client &amp; Pipeline Platform</div>
          <p className="small muted" style={{ marginBottom: 20 }}>
            The page you followed doesn&apos;t exist, or the record it pointed to has been removed.
          </p>
          <Link href={routes.dashboard()} className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Back to the dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

NotFoundPage.getLayout = (page) => page;
