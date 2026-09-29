import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useCurrentUser } from '@/hooks/useAppStore';
import { usePageKey } from '@/hooks/usePageKey';

/**
 * The signed-in chrome: sidebar + topbar + scrolling main column.
 *
 * Lives in `_app` rather than inside each page, so navigating between screens keeps
 * the same DOM for the shell — only the main column re-renders.
 */
export default function AppLayout({ children }) {
  const user = useCurrentUser();
  const pageKey = usePageKey();

  // Only reachable before the store has adopted its payload (e.g. straight after a
  // client-side sign-in). getServerSideProps guarantees data on a real page load.
  if (!user) return <div className="app-loading">Loading your workspace…</div>;

  return (
    <div className="app">
      <Sidebar user={user} pageKey={pageKey} />
      <div className="main-area">
        <Topbar user={user} pageKey={pageKey} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
