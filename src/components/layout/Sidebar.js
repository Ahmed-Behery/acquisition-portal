import { Fragment } from 'react';
import Link from 'next/link';
import { NAV_SECTIONS } from '@/constants/navigation';
import { selectOpenReferrals, selectUnreadCount, selectInterestReceived } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from '@/utils/clsx';

/** Left navigation. Badge counts are derived from state, never stored. */
export default function Sidebar({ user, pageKey }) {
  const state = useAppState();
  const { signOut } = useAuth();

  const counts = {
    unread: selectUnreadCount(state, user.id),
    interests: selectInterestReceived(state, user.id).length,
    referrals: selectOpenReferrals(state, user).length,
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">Contact Group</div>
        <div className="brand-sub">Client &amp; Pipeline Platform</div>
      </div>

      <nav className="nav">
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => {
              const count = item.badge ? counts[item.badge] : 0;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={clsx('nav-item', pageKey === item.key && 'active')}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                  {count ? <span className="badge">{count}</span> : null}
                </Link>
              );
            })}
          </Fragment>
        ))}
      </nav>

      <div className="sidebar-foot">
        <a onClick={signOut} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && signOut()}>
          Sign out
        </a>
      </div>
    </aside>
  );
}
