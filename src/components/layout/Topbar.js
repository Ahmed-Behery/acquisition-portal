import { useRouter } from 'next/router';
import { PAGE_TITLES } from '@/constants/navigation';
import { selectCompany, selectUnreadCount } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { routes } from '@/utils/links';
import { Avatar } from '@/components/common/misc';

export default function Topbar({ user, pageKey }) {
  const state = useAppState();
  const router = useRouter();
  const { signOut } = useAuth();
  const unread = selectUnreadCount(state, user.id);
  const companyCode = user.companyId ? selectCompany(state, user.companyId)?.code : null;

  return (
    <div className="topbar">
      <div className="topbar-title">{PAGE_TITLES[pageKey] || ''}</div>
      <div className="topbar-actions">
        <button
          type="button"
          className="bell"
          onClick={() => router.push(routes.inbox())}
          title="Notifications"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          ✉{unread ? <span className="count">{unread}</span> : null}
        </button>
        <div
          className="user-chip"
          onClick={signOut}
          title="Click to switch user"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && signOut()}
        >
          <Avatar name={user.name} />
          <div>
            <div className="nm">{user.name}</div>
            <div className="rl">
              {user.role}
              {companyCode ? ' · ' + companyCode : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
