import { useCallback, useEffect, useRef, useState } from 'react';
import Field from '@/components/common/Field';
import { existingProspectMatches } from '@/domain/pipelineRules';
import { directoryService } from '@/services/platformService';
import { useAppState } from '@/hooks/useAppStore';
import { useClickOutside } from '@/hooks/useClickOutside';

const SEARCH_DEBOUNCE_MS = 250;
const LOCAL_RESULT_LIMIT = 12;

/**
 * Prospect name picker.
 *
 * Looks the name up in the Egyptian companies directory (live, with the seeded list
 * as a fallback), surfaces records that already exist so they cannot be entered
 * twice, and offers a "Not included" escape hatch that routes the entry to the Head
 * of Products for validation.
 */
export default function ProspectLookup({ form, onPick, onPickNotIncluded, onClear, onFreeNameChange, reengage }) {
  const state = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside([searchRef, dropdownRef], close, open);

  // Debounced directory lookup, cancelled when the query changes again.
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let found = [];
      try {
        const data = await directoryService.searchCompanies(query, controller.signal);
        found = data.results || [];
      } catch {
        /* fall back to the local list below */
      }
      if (!found.length) {
        const ql = query.toLowerCase();
        found = state.egyptCompanies
          .filter((c) => c.name.toLowerCase().includes(ql))
          .slice(0, LOCAL_RESULT_LIMIT)
          .map((c) => ({ name: c.name, crn: c.crn || '' }));
      }
      if (!controller.signal.aborted) setResults(found);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, state.egyptCompanies]);

  if (reengage) {
    return (
      <Field
        label="Prospect name"
        required
        hint="The company is fixed for a re-engagement. Complete the rest as a fresh opportunity."
      >
        <div className="prospect-selected">
          <span className="ps-chip">
            ✓ {reengage.name} <span className="small muted">(re-engaging)</span>
          </span>
        </div>
      </Field>
    );
  }

  // Existing records are shown first and flagged; drop them from the directory list
  // so a name is never offered twice.
  const existing = existingProspectMatches(state, query);
  const existingNames = new Set(existing.map((e) => e.name.trim().toLowerCase()));
  const directory = results.filter((c) => !existingNames.has((c.name || '').trim().toLowerCase()));

  const selectedChip =
    form.inList === 'false' ? (
      <span className="ps-chip ps-chip-warn">⚠ Not in directory — typing manually</span>
    ) : form.inList === 'true' ? (
      <span className={`ps-chip${form.existingMatch ? ' ps-chip-warn' : ''}`}>
        {form.existingMatch ? '⚠ ' : '✓ '}
        {form.name}
        {form.existingMatch ? null : <span className="small muted"> (from directory)</span>}
      </span>
    ) : null;

  return (
    <Field label="Prospect name" required>
      {selectedChip ? (
        <div className="prospect-selected">
          {selectedChip}{' '}
          <a className="ps-clear" onClick={onClear} role="button" tabIndex={0}>
            change
          </a>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            ref={searchRef}
            type="text"
            autoComplete="off"
            placeholder="Search the Egyptian companies directory…"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
          {open ? (
            <div ref={dropdownRef} className="lookup-dd">
              {existing.map((record) => (
                <div
                  key={`existing-${record.id}`}
                  className="lookup-row"
                  style={{ background: '#fef2f2' }}
                  onClick={() => onPick({ name: record.name }, { existingMatch: true })}
                >
                  <div>
                    <div className="lr-name">{record.name}</div>
                    <div className="small" style={{ color: 'var(--red)' }}>
                      Already in {record.where}
                      {record.code ? ' · ' + record.code : ''} — cannot be added again
                    </div>
                  </div>
                  <span className="verified-tag" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
                    exists
                  </span>
                </div>
              ))}

              {directory.map((company) => (
                <div key={`dir-${company.name}`} className="lookup-row" onClick={() => onPick(company)}>
                  <div>
                    <div className="lr-name">{company.name}</div>
                    {company.crn ? <div className="small muted">CR {company.crn}</div> : null}
                  </div>
                  {company.verified ? <span className="verified-tag">✓ verified</span> : null}
                </div>
              ))}

              <div className="lookup-row lookup-notinc" onClick={onPickNotIncluded}>
                <div className="lr-name">➕ Not included — type the name manually</div>
                <div className="small muted">The Head of Products will validate it</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="hint">
        Pick a verified company from the directory. If it isn’t listed, choose <b>“Not included”</b> and type the name
        — only then is it sent to the Head of Products to validate.
      </div>

      {form.inList === 'false' ? (
        <div style={{ marginTop: 8 }}>
          <input
            type="text"
            autoFocus
            placeholder="Type the prospect's legal name (not in directory)"
            value={form.freeName}
            onChange={(e) => onFreeNameChange(e.target.value)}
          />
        </div>
      ) : null}
    </Field>
  );
}
