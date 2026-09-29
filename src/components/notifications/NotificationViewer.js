import Card from '@/components/common/Card';
import Banner from '@/components/common/Banner';
import { Hr } from '@/components/common/misc';
import { canExpressInterest } from '@/domain/notifications';
import { selectPipelineEntry } from '@/domain/selectors';
import { linkToHref } from '@/utils/links';

const PIPELINE_ALERT_TAGS = ['[Pipeline Alert]', '[New Prospect]'];

/** The reading pane of the simulated inbox. */
export default function NotificationViewer({ state, user, notification, onOpenLink, onExpressInterest }) {
  if (!notification) {
    return (
      <div className="card center muted" style={{ padding: 40 }}>
        Select a notification to read.
      </div>
    );
  }

  const href = linkToHref(notification.link);

  return (
    <Card>
      <div className="small muted" style={{ fontFamily: 'monospace' }}>
        FROM: notifications@contactgroup.com
        <br />
        TO: {user.email}
        <br />
        SENT: {notification.time}
      </div>
      <Hr />
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{notification.subject}</div>
      <div className="email-body">{notification.body}</div>

      {href ? (
        <button type="button" className="btn btn-primary mt-2" onClick={() => onOpenLink(href)}>
          Open referenced record →
        </button>
      ) : null}

      <InterestReply
        state={state}
        user={user}
        notification={notification}
        onExpressInterest={onExpressInterest}
      />
    </Card>
  );
}

/**
 * "Reply: I'm interested" — shown to leadership on a new-prospect alert, and
 * running exactly the same workflow as the button on the entry itself.
 */
function InterestReply({ state, user, notification, onExpressInterest }) {
  const isPipelineAlert = PIPELINE_ALERT_TAGS.some((tag) => notification.subject?.includes(tag));
  const entryId = notification.link?.startsWith('pipeline-detail/') ? notification.link.split('/')[1] : null;

  if (!canExpressInterest(user) || !isPipelineAlert || !entryId) return null;

  const entry = selectPipelineEntry(state, entryId);
  if (!entry) return null;

  if (entry.interestedFlags?.some((f) => f.userId === user.id)) {
    return (
      <Banner tone="success" className="mt-2" style={{ marginTop: 12 }}>
        ✓ You&apos;ve already flagged this entry as a potential client.
      </Banner>
    );
  }

  return (
    <div className="banner banner-info mt-2" style={{ marginTop: 12, display: 'block' }}>
      <div style={{ marginBottom: 8 }}>
        <b>Reply to this email</b> to express interest in joining the visit:
      </div>
      <button type="button" className="btn btn-success" onClick={() => onExpressInterest(entry)}>
        📧 Reply: I&apos;m interested
      </button>
    </div>
  );
}
