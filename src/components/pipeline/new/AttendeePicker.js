import { useCallback, useRef, useState } from 'react';
import Field from '@/components/common/Field';
import { selectCompany, selectUser } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';
import { useClickOutside } from '@/hooks/useClickOutside';

/** Multi-select of holding colleagues attending the visit. */
export default function AttendeePicker({ attendees, currentUserId, onAdd, onRemove }) {
  const state = useAppState();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside([inputRef, dropdownRef], close, open);

  const matches = query.trim()
    ? state.users.filter((u) => !attendees.includes(u.id) && u.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const add = (userId) => {
    onAdd(userId);
    setQuery('');
    setOpen(false);
  };

  const currentUserName = selectUser(state, currentUserId)?.name;

  return (
    <Field
      className="mt-2"
      label="Attendees"
      required
      hint={`${currentUserName} is included automatically. Click to add other attendees from the holding.`}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: 8,
          border: '1px solid var(--line-strong)',
          borderRadius: 5,
          minHeight: 42,
          background: 'var(--surface)',
        }}
      >
        {attendees.length === 0 ? (
          <div className="small muted" style={{ padding: 6 }}>
            No attendees yet — type a name below to add
          </div>
        ) : (
          attendees.map((id) => {
            const attendee = selectUser(state, id);
            if (!attendee) return null;
            const isMe = id === currentUserId;
            return (
              <div
                key={id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span>{attendee.name}</span>
                <span className="small muted" style={{ opacity: 0.8 }}>
                  {attendee.role}
                  {attendee.companyId ? ' · ' + selectCompany(state, attendee.companyId)?.code : ''}
                </span>
                {isMe ? (
                  <span className="small" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                    (you)
                  </span>
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    title="Remove"
                    onClick={() => onRemove(id)}
                    style={{ cursor: 'pointer', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
                  >
                    ×
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          placeholder="Type to search by name (alphabet filter)…"
          style={{ marginTop: 6 }}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {open && query.trim() ? (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: 240,
              overflowY: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--line-strong)',
              borderRadius: 5,
              zIndex: 50,
              marginTop: 2,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {matches.length === 0 ? (
              <div className="small muted" style={{ padding: 10 }}>
                No matches
              </div>
            ) : (
              matches.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => add(candidate.id)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{candidate.name}</div>
                    <div className="small muted">
                      {candidate.role}
                      {candidate.companyId ? ' · ' + selectCompany(state, candidate.companyId)?.code : ' · Group'} ·{' '}
                      {candidate.email}
                    </div>
                  </div>
                  <div className="small" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    + Add
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </Field>
  );
}
