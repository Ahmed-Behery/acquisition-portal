import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import Card from '@/components/common/Card';
import { DEMO_PASSWORD, RECIPIENT_GROUPS } from '@/constants/roles';
import { adminService } from '@/services/platformService';
import { useAppStore } from '@/hooks/useAppStore';
import { useAppState } from '@/hooks/useAppStore';
import { dialogs } from '@/utils/dialogs';
import { routes } from '@/utils/links';

const EMPTY = { name: '', email: '', group: RECIPIENT_GROUPS[0] };

/** Directory recipients, grouped, with Admin-only account creation. */
export default function RecipientsTab({ isAdmin }) {
  const state = useAppState();
  const { reload } = useAppStore();
  const router = useRouter();
  const [draft, setDraft] = useState(EMPTY);
  const [pending, setPending] = useState(false);

  const add = async () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      dialogs.alert('Name and email are required.');
      return;
    }
    setPending(true);
    try {
      const { user } = await adminService.createRecipient({
        name: draft.name.trim(),
        email: draft.email.trim(),
        group: draft.group,
      });
      await reload();
      setDraft(EMPTY);
      dialogs.alert(`${draft.name} added as ${draft.group}. Login: ${user.username} / ${DEMO_PASSWORD}`);
      router.push(routes.admin('recipients'));
    } catch (error) {
      dialogs.alert(error.status ? error.message : 'Network error adding recipient.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Card
      title="Notification recipients"
      titleNote={`· ${state.recipients.length} people notified on every new prospect`}
    >
      {RECIPIENT_GROUPS.map((group) => {
        const members = state.recipients.filter((r) => r.group === group);
        return (
          <Fragment key={group}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '14px 0 6px',
              }}
            >
              {group} · {members.length}
            </div>
            <table className="adm-table">
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td className="muted small">{member.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Fragment>
        );
      })}

      {isAdmin ? (
        <>
          <div className="card-title mt-3" style={{ fontSize: 14 }}>
            Add a recipient (creates a login)
          </div>
          <div className="adm-row-input">
            <input
              type="text"
              placeholder="Full name"
              aria-label="Recipient name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <input
              type="email"
              placeholder="email@contact.eg"
              aria-label="Recipient email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
            <select
              aria-label="Recipient group"
              style={{ maxWidth: 160 }}
              value={draft.group}
              onChange={(e) => setDraft((d) => ({ ...d, group: e.target.value }))}
            >
              {RECIPIENT_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={add} disabled={pending}>
              {pending ? 'Adding…' : 'Add'}
            </button>
          </div>
          <div className="hint small muted" style={{ marginTop: 6 }}>
            New accounts get the default password <code>{DEMO_PASSWORD}</code>.
          </div>
        </>
      ) : (
        <div className="hint small muted mt-2">Only the Admin can add or remove login accounts.</div>
      )}
    </Card>
  );
}
