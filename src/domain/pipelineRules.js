import { INACTIVE_STATUSES, STALE_ENTRY_DAYS } from '@/constants/pipeline';
import { ROLES } from '@/constants/roles';
import { daysSinceUpdate } from '@/utils/dates';
import { selectClient, selectUser } from './selectors';

/**
 * Business rules for the pipeline — the predicates and screening logic the original
 * app carried inline. Pure functions: they read state, they never write to it.
 */

/**
 * A pipeline entry is part of the ACTIVE pipeline unless it has left it
 * (lost, or converted to a merchant — "Done Deal" once HoP-approved).
 */
export function isActivePipe(entry) {
  return !INACTIVE_STATUSES.includes(entry.status);
}

export function isPendingHop(entry) {
  return Boolean(entry.status && entry.status.startsWith('Pending HoP'));
}

export function isClosed(entry) {
  return ['Closed - Lost', 'Converted - Active Client', 'Done Deal'].includes(entry.status);
}

/** RMs see only the prospects they personally entered or own; leadership sees all. */
export function rmScopedPipes(state, user) {
  const all = state.pipeline.filter(isActivePipe);
  if (user.role !== ROLES.RM) return all;
  return all.filter((p) => (p.enteredBy || p.rmId) === user.id || p.rmId === user.id);
}

/** AML screening: flag a name that matches the compliance watchlist. */
export function amlCheck(state, name) {
  const n = (name || '').toLowerCase();
  const matches = (state.amlWatchlist || []).filter((w) => n.includes(String(w).toLowerCase()));
  return { status: matches.length ? 'review' : 'clear', matches };
}

/** No-duplication: check a company name across pipeline, merchants & good-to-go. */
export function findDuplicate(state, name, excludeId) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return null;

  // Active pipeline entries only — Done Deal / Converted are already surfaced below as merchants.
  const entry = state.pipeline.find(
    (p) =>
      p.id !== excludeId &&
      (p.prospect || '').trim().toLowerCase() === n &&
      !['Closed - Lost', 'Done Deal', 'Converted - Active Client'].includes(p.status)
  );
  if (entry) {
    return {
      where: entry.status === 'Good to Go' ? 'the Good to Go list' : 'the Pipeline',
      code: entry.code || '',
      owner: selectUser(state, entry.rmId)?.name || '—',
      status: entry.status,
      id: entry.id,
      page: 'pipeline-detail',
    };
  }

  const merchant = state.clients.find((c) => (c.name || '').trim().toLowerCase() === n);
  if (merchant) {
    return {
      where: merchant.status === 'Good to Go' ? 'the Good to Go list (merchant)' : 'All Merchants',
      code: merchant.code || '',
      owner: selectUser(state, merchant.rmId)?.name || '—',
      status: merchant.status,
      id: merchant.id,
      page: 'client-detail',
    };
  }
  return null;
}

/** True when a duplicate points at a live merchant, which is a cross-sell not a block. */
export function isMerchantDuplicate(duplicate) {
  return Boolean(duplicate) && duplicate.page === 'client-detail' && duplicate.status !== 'Good to Go';
}

/** Builds the cross-sell context attached to an entry raised against a merchant. */
export function buildCrossSellContext(state, duplicate) {
  const existing = selectClient(state, duplicate.id);
  return {
    clientId: duplicate.id,
    existingCode: duplicate.code,
    existingProducts: existing ? existing.productsSold.slice() : [],
    existingCompanyId: existing ? existing.companyId : null,
    owner: duplicate.owner,
  };
}

/** Product lines for an entry (falls back to productsOfInterest for legacy entries). */
export function pipeProductLines(entry) {
  if (Array.isArray(entry.productLines) && entry.productLines.length) return entry.productLines;
  return (entry.productsOfInterest || []).map((productId) => ({
    productId,
    subStatus: 'Negotiation',
    main: true,
  }));
}

/** Entries with no update inside the reminder window — drives the weekly sweep. */
export function staleEntries(state, today, thresholdDays = STALE_ENTRY_DAYS) {
  return state.pipeline.filter((p) => {
    if (INACTIVE_STATUSES.includes(p.status)) return false;
    if (isPendingHop(p)) return false;
    return daysSinceUpdate(p, today) >= thresholdDays;
  });
}

/**
 * Existing records (merchants + active pipeline + good-to-go) that match the query —
 * surfaced in the prospect lookup so an RM sees a name that already exists and is
 * blocked from re-entering it.
 */
export function existingProspectMatches(state, query) {
  const ql = (query || '').trim().toLowerCase();
  const seen = new Set();
  const out = [];

  const push = (name, where, code, id, page) => {
    const key = (name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    if (ql && !key.includes(ql)) return;
    seen.add(key);
    out.push({ name, where, code: code || '', id, page });
  };

  // Merchants first, then active pipeline (Done Deal / Converted / Lost excluded —
  // already merchants or gone).
  state.clients.forEach((c) =>
    push(c.name, c.status === 'Good to Go' ? 'Good to Go' : 'All Merchants', c.code, c.id, 'client-detail')
  );
  state.pipeline.forEach((p) => {
    if (['Closed - Lost', 'Done Deal', 'Converted - Active Client'].includes(p.status)) return;
    push(p.prospect, p.status === 'Good to Go' ? 'Good to Go' : 'Pipeline', p.code, p.id, 'pipeline-detail');
  });

  return out.slice(0, 12);
}

/** The next sequential merchant code for a company, e.g. `FACT-004`. */
export function nextMerchantCode(state, companyId) {
  const company = state.companies.find((c) => c.id === companyId);
  const seq = String(state.clients.filter((c) => c.companyId === companyId).length + 1).padStart(3, '0');
  return `${company?.code || '???'}-${seq}`;
}

/** The next sequential pipeline reference for a company, e.g. `FACT-P007`. */
export function nextPipelineCode(state, companyId) {
  const company = state.companies.find((c) => c.id === companyId);
  const seq = String(state.pipeline.filter((p) => p.companyId === companyId).length + 1).padStart(3, '0');
  return `${company?.code || '???'}-P${seq}`;
}

/**
 * Live AML + duplicate screening for a prospect name, as shown under the field on
 * the New Entry form. Returns everything the form needs to render its banners and
 * to decide whether saving is blocked.
 */
export function screenProspectName(state, name, { skipDuplicateCheck } = {}) {
  const trimmed = (name || '').trim();
  const empty = { name: '', aml: null, duplicate: null, crossSell: null, blocked: false };
  if (!trimmed) return empty;

  const aml = amlCheck(state, trimmed);
  const clear = { name: trimmed, aml, duplicate: null, crossSell: null, blocked: false };
  if (skipDuplicateCheck) return clear;

  const duplicate = findDuplicate(state, trimmed);
  if (!duplicate) return clear;

  // An existing merchant is allowed through as a cross-sell (routed to HoP to validate
  // a different department + product); an active pipeline entry or a Good-to-Go item
  // is blocked outright.
  if (isMerchantDuplicate(duplicate)) {
    return { name: trimmed, aml, duplicate, crossSell: buildCrossSellContext(state, duplicate), blocked: false };
  }
  return { name: trimmed, aml, duplicate, crossSell: null, blocked: true };
}
