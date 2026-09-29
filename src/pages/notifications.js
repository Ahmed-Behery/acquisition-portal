import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PageMeta from '@/components/common/PageMeta';
import PageHead from '@/components/common/PageHead';
import NotificationViewer from '@/components/notifications/NotificationViewer';
import InterestModal from '@/components/modals/InterestModal';
import { selectMyNotifications } from '@/domain/selectors';
import { useAppState, useAppStore, useCurrentUser } from '@/hooks/useAppStore';
import { clsx } from '@/utils/clsx';
import { previewText } from '@/utils/format';
import { withProtectedPage } from '@/server/pageGuard';

/** Simulated email inbox. In production these go to the user's corporate mailbox. */
export default function NotificationsPage() {
  const router = useRouter();
  const state = useAppState();
  const { store } = useAppStore();
  const user = useCurrentUser();
  const [selectedId, setSelectedId] = useState(null);
  const [interestEntry, setInterestEntry] = useState(null);

  const mine = selectMyNotifications(state, user.id);
  const active = mine.find((n) => n.id === selectedId) || mine[0] || null;

  // Opening a notification marks it read, exactly as selecting it did before.
  useEffect(() => {
    if (!active || active.read) return;
    store.mutate(() => {
      active.read = true;
    });
  }, [active, store]);

  return (
    <>
      <PageMeta title="Notifications" description="Platform alerts, approvals and status updates for your account." />
      <PageHead
        title="Notifications"
        subtitle="Simulated email inbox. In production these go to your real corporate email."
      />

      <div className="two-col" style={{ gridTemplateColumns: '380px 1fr' }}>
        <div className="card" style={{ padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
          {mine.length === 0 ? (
            <div className="center muted" style={{ padding: 30 }}>
              No notifications.
            </div>
          ) : (
            mine.map((notification) => (
              <div
                key={notification.id}
                className={clsx('notif', !notification.read && 'unread')}
                onClick={() => setSelectedId(notification.id)}
              >
                <div className="notif-sub">{notification.subject}</div>
                <div className="notif-prev">{previewText(notification.body)}…</div>
                <div className="notif-time">{notification.time}</div>
              </div>
            ))
          )}
        </div>

        <NotificationViewer
          state={state}
          user={user}
          notification={active}
          onOpenLink={(href) => router.push(href)}
          onExpressInterest={setInterestEntry}
        />
      </div>

      {interestEntry ? (
        <InterestModal open onClose={() => setInterestEntry(null)} entry={interestEntry} delegateMode={false} />
      ) : null}
    </>
  );
}

export const getServerSideProps = withProtectedPage();
