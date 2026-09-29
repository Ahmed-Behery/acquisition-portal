import { useState } from 'react';
import Card from '@/components/common/Card';
import { selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

const TYPE_PREFIX = { return: '↩ ', approve: '✓ ' };

/** Comment thread and validation history. */
export default function CommentsCard({ state, entry, canComment }) {
  const actions = useActions();
  const [text, setText] = useState('');

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      dialogs.alert('Please type a comment.');
      return;
    }
    actions.pipeline.addComment(entry.id, trimmed);
    setText('');
  };

  const comments = entry.comments || [];

  return (
    <Card className="mt-2" title="Comments & validation history">
      {comments.length ? (
        comments.map((comment, index) => (
          <div key={`${comment.at}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="flex-between">
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                {selectUser(state, comment.by)?.name || '—'}{' '}
                <span className="small muted">· {comment.role || ''}</span>
              </div>
              <div className="small muted">{comment.at || ''}</div>
            </div>
            <div style={{ fontSize: 13, marginTop: 3 }}>
              {TYPE_PREFIX[comment.type] || ''}
              {comment.text}
            </div>
          </div>
        ))
      ) : (
        <div className="small muted" style={{ padding: '10px 0' }}>
          No comments yet.
        </div>
      )}

      {canComment ? (
        <div className="adm-row-input">
          <input
            type="text"
            placeholder="Add a comment…"
            aria-label="Add a comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" className="btn btn-primary" onClick={add}>
            Add
          </button>
        </div>
      ) : null}
    </Card>
  );
}
