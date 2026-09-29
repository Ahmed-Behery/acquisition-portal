import Modal from '@/components/common/Modal';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';
import { fmtMoney } from '@/utils/format';

/** Unfinished New Entry forms, saved per user in this browser. */
export default function DraftsModal({ open, onClose, drafts }) {
  const actions = useActions();

  const resume = (draft) => {
    onClose();
    actions.pipeline.resumeDraft(draft);
  };

  const remove = (draftId) => {
    if (!dialogs.confirm('Delete this draft?')) return;
    drafts.remove(draftId);
  };

  return (
    <Modal open={open} onClose={onClose} title={`📝 My draft entries (${drafts.count})`}>
      {drafts.count === 0 ? (
        <div className="center muted" style={{ padding: 24 }}>
          No drafts. An unfinished new entry is saved here automatically.
        </div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Saved</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {drafts.drafts.map((draft) => (
              <tr key={draft.id}>
                <td className="name">
                  {draft.label}
                  {draft.auto ? <span className="small muted"> · auto-saved</span> : null}
                  <div className="small muted">
                    {draft.industry || '—'}
                    {draft.value ? ' · ' + fmtMoney(parseFloat(draft.value)) : ''}
                  </div>
                </td>
                <td className="small muted">{draft.savedAt || ''}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => resume(draft)}>
                    Resume
                  </button>{' '}
                  <button type="button" className="btn btn-sm" onClick={() => remove(draft.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
