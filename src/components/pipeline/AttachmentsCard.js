import { useRef } from 'react';
import Card from '@/components/common/Card';
import { ATTACHMENT_ACCEPT } from '@/constants/pipeline';
import { selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

/**
 * Supporting documents on an entry. No approval gate: the entrant, the responsible
 * RM, or the Head of Products may upload at any time.
 */
export default function AttachmentsCard({ state, entry, user, canUpload, isHop, isClosed }) {
  const actions = useActions();
  const inputRef = useRef(null);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const note = dialogs.prompt(
      `Add a short description for "${file.name}" (optional, helps reviewers find it later):`
    );
    // A cancelled prompt aborts the upload.
    if (note === null) return;

    actions.pipeline.addAttachment(entry.id, { fileName: file.name, note });
  };

  const attachments = entry.attachments || [];

  return (
    <Card
      className="mt-2"
      title="Attachments"
      action={
        canUpload ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              style={{ display: 'none' }}
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFile}
            />
            <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
              📎 Upload document
            </button>
          </div>
        ) : !isClosed ? (
          <span className="small muted">Only the initiator and the Head of Products can upload documents.</span>
        ) : null
      }
    >
      {attachments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--line)',
                borderRadius: 5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18 }}>📎</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {attachment.fileName}
                  </div>
                  <div className="small muted">
                    Uploaded by {selectUser(state, attachment.uploadedBy)?.name || 'Unknown'} on{' '}
                    {attachment.uploadedAt}
                    {attachment.note ? ` · "${attachment.note}"` : ''}
                  </div>
                </div>
              </div>
              {attachment.uploadedBy === user.id || isHop ? (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ marginLeft: 8 }}
                  onClick={() => actions.pipeline.removeAttachment(entry.id, attachment.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="small muted" style={{ padding: '14px 0', textAlign: 'center' }}>
          No documents attached yet
          {isClosed
            ? '.'
            : '. Click "Upload document" to add supporting files (contracts, proposals, correspondence, etc.).'}
        </div>
      )}
    </Card>
  );
}
