/**
 * Per-user draft storage for unfinished New Entry forms.
 *
 * Browser-local by design (as in the original app) — a draft is personal scratch
 * space, not shared state, so it never goes to the server. Every access is guarded:
 * `localStorage` can be unavailable (private mode, blocked site data) and must never
 * take the page down.
 */
import { todayLabel } from '@/utils/dates';

const keyFor = (userId) => 'cg_drafts_' + (userId || 'anon');

function available() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function readDrafts(userId) {
  if (!available()) return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDrafts(userId, list) {
  if (!available()) return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch {
    /* quota or blocked storage — drafts are best-effort */
  }
}

/** Inserts or replaces a draft, returning its id. */
export function upsertDraft(userId, draft, { auto = false, editingId = null } = {}) {
  const list = readDrafts(userId);
  const record = {
    ...draft,
    id: editingId || draft.id || 'draft_' + Date.now(),
    savedAt: todayLabel(),
    label: draft.name || '(unnamed prospect)',
    auto,
  };
  const index = list.findIndex((d) => d.id === record.id);
  if (index >= 0) list[index] = record;
  else list.unshift(record);
  writeDrafts(userId, list);
  return record.id;
}

export function deleteDraft(userId, draftId) {
  writeDrafts(userId, readDrafts(userId).filter((d) => d.id !== draftId));
}

/** A draft is only worth keeping once the RM typed something beyond the defaults. */
export function draftHasContent(draft) {
  return Boolean(
    draft.name ||
      draft.industry ||
      draft.commercialRegister ||
      draft.contactPerson ||
      draft.value ||
      draft.summary ||
      draft.products?.length
  );
}
