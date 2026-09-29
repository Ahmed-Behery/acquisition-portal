import Card from '@/components/common/Card';
import Banner from '@/components/common/Banner';
import { ADMIN_MAILBOX } from '@/constants/roles';
import { useAppState } from '@/hooks/useAppStore';

const MAX_ROWS = 100;

/** Admin-only log of every alert raised by a submitted request. */
export default function EmailLogTab() {
  const state = useAppState();
  const log = state.adminEmailLog || [];

  return (
    <Card title="Admin email alerts" titleNote={`· sent to ${ADMIN_MAILBOX} on every submitted request`}>
      <Banner tone={state.smtpConfigured ? 'success' : 'info'} className="mb-2">
        {state.smtpConfigured ? (
          <>
            <b>SMTP is configured.</b> Real emails are being delivered to the admin inbox, and every alert is also
            logged below and shown in the Admin in-app notifications.
          </>
        ) : (
          <>
            <b>In-app + logged mode.</b> Every submission instantly alerts the admin in-app (see Notifications) and is
            logged below. To also deliver to a real mailbox, set the SMTP_* environment variables on the server
            (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) — no code changes needed.
          </>
        )}
      </Banner>

      {log.length ? (
        <table className="adm-table">
          <thead>
            <tr>
              <th>When</th>
              <th>From</th>
              <th>Subject</th>
              <th>Delivered</th>
            </tr>
          </thead>
          <tbody>
            {log.slice(0, MAX_ROWS).map((mail) => (
              <tr key={mail.id}>
                <td className="small muted">{(mail.at || '').replace('T', ' ').slice(0, 16)}</td>
                <td className="small">{mail.from || '—'}</td>
                <td>{mail.subject || ''}</td>
                <td>
                  {mail.sent ? (
                    <span className="verified-tag">✓ sent</span>
                  ) : (
                    <span className="small muted">logged</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="small muted" style={{ padding: '10px 0' }}>
          No alerts yet. Submit a request (new entry, extend, done deal, edit, delete) to generate one.
        </div>
      )}
    </Card>
  );
}
