import { ONBOARDING_NOTIFY_IDS } from '@/constants/roles';
import { dialogs } from '@/utils/dialogs';
import { fmtMoneyFull } from '@/utils/format';
import { todayLabel } from '@/utils/dates';
import { legacyLink, routes } from '@/utils/links';
import { addCommentToEntry, notifyAdmin, notifyEntrant, notifyRecipients, pushNotification } from '../notifications';
import { nextMerchantCode } from '../pipelineRules';
import { selectCompany, selectMe, selectPipelineEntry, selectUser } from '../selectors';

/** Head of Products review decisions. */

const NO_NAV = {};

/* ---------------------------------------------------------------- validation */

export function approveValidation(store, entryId) {
  const note = dialogs.prompt('Optional approval note (visible to the RM):', '');
  if (note === null) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const hop = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    if (note.trim()) addCommentToEntry(state, entry, note.trim(), 'approve');
    entry.status = 'First Meeting';
    entry.lastUpdate = todayLabel();

    notifyEntrant(
      state,
      entry,
      `[Validated] ${entry.prospect} approved`,
      `Your pipeline entry "${entry.prospect}" has been validated by ${hop.name} (Head of Products) and is now active (First Meeting).${note.trim() ? '\n\nNote: "' + note.trim() + '"' : ''}`
    );
    notifyRecipients(
      state,
      entry,
      `[Validated] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${entry.prospect} has been validated by ${hop.name} (Head of Products) and is now active (First Meeting).\nIndustry: ${entry.industry}\nResponsible: ${selectUser(state, entry.rmId).name}`
    );
    notifyAdmin(
      state,
      `Entry validated: ${entry.prospect}`,
      `${hop.name} (Head of Products) validated and activated "${entry.prospect}" (First Meeting).`,
      link
    );

    dialogs.alert('Entry validated and set to "First Meeting". Leadership has been notified.');
    return NO_NAV;
  });
}

export function returnChooseName(store, entryId) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const hop = selectMe(state);
    const text =
      'Please choose prospect name — this company IS in the directory; select it from the dropdown instead of free text.';

    addCommentToEntry(state, entry, text, 'return');
    entry.status = 'Returned to RM';
    entry.lastUpdate = todayLabel();

    notifyEntrant(
      state,
      entry,
      `[Returned] ${entry.prospect} — please choose prospect name`,
      `${hop.name} (Head of Products) returned your entry.\n\nReason: ${text}\n\nPlease re-open it, pick the prospect from the directory, and resubmit.`
    );

    dialogs.alert('Returned to RM with comment: "Please choose prospect name."');
    return NO_NAV;
  });
}

export function returnEntry(store, entryId) {
  const text = dialogs.prompt('Reason for returning this entry to the RM (required):', '');
  if (text === null) return NO_NAV;
  if (!text.trim()) {
    dialogs.alert('A comment is required to return the entry.');
    return NO_NAV;
  }

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const hop = selectMe(state);

    addCommentToEntry(state, entry, text.trim(), 'return');
    entry.status = 'Returned to RM';
    entry.lastUpdate = todayLabel();

    notifyEntrant(
      state,
      entry,
      `[Returned] ${entry.prospect} returned for revision`,
      `${hop.name} (Head of Products) returned your entry for revision.\n\nComment: "${text.trim()}"\n\nPlease address it and resubmit for validation.`
    );

    dialogs.alert('Entry returned to RM with your comment.');
    return NO_NAV;
  });
}

/* ------------------------------------------------------------------ extension */

export function approveExtension(store, entryId) {
  const entry = selectPipelineEntry(store.getState(), entryId);
  if (!entry || !dialogs.confirm(`Approve extension for "${entry.prospect}"?`)) return NO_NAV;

  return store.mutate((state) => {
    const target = selectPipelineEntry(state, entryId);
    const hop = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    target.status = 'Negotiation C2';
    target.lastUpdate = todayLabel();

    pushNotification(state, {
      to: target.enteredBy || target.rmId,
      subject: `[HoP Approved] Extension granted: ${target.prospect}`,
      body: `Head of Products has approved your extension request on ${target.prospect}.\n\nThe entry has been moved to "Negotiation C2".`,
      link,
    });
    notifyRecipients(
      state,
      target,
      `[Extension Approved] ${target.prospect} — ${selectCompany(state, target.companyId).code}`,
      `${hop.name} (Head of Products) approved an extension for ${target.prospect}. Status is now Negotiation C2.\nResponsible: ${selectUser(state, target.rmId).name}`
    );
    notifyAdmin(
      state,
      `Extension approved: ${target.prospect}`,
      `${hop.name} (Head of Products) approved the extension for "${target.prospect}" (→ Negotiation C2).`,
      link
    );

    dialogs.alert('Approved. RM and leadership have been notified.');
    return NO_NAV;
  });
}

/* ------------------------------------------------------------------ done deal */

/** Approves a Done Deal and converts the prospect into a merchant. */
export function approveDoneDeal(store, entryId) {
  const state0 = store.getState();
  const entry0 = selectPipelineEntry(state0, entryId);
  if (!entry0) return NO_NAV;
  const newCode = nextMerchantCode(state0, entry0.companyId);
  if (!dialogs.confirm(`Approve Done Deal for "${entry0.prospect}"?\n\nA new merchant will be created with code ${newCode}.`)) {
    return NO_NAV;
  }

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const hop = selectMe(state);
    const company = selectCompany(state, entry.companyId);

    const merchant = {
      id: 'c_' + Date.now(),
      name: entry.prospect,
      code: newCode,
      companyId: entry.companyId,
      rmId: entry.rmId,
      exposure: entry.value,
      ytdSales: 0,
      productsSold: entry.productsOfInterest.slice(),
      status: 'Active',
      industry: entry.industry,
    };
    state.clients.push(merchant);
    entry.status = 'Done Deal';
    entry.lastUpdate = todayLabel();

    const merchantLink = legacyLink('client-detail', merchant.id);
    const rmName = selectUser(state, entry.rmId).name;

    ONBOARDING_NOTIFY_IDS.forEach((to) =>
      pushNotification(state, {
        to,
        subject: `[Merchant Onboarded] ${entry.prospect} — ${newCode}`,
        body: `Head of Products has validated a Done Deal. ${entry.prospect} is now an active merchant in the Master Ledger.\n\nCode: ${newCode}\nResponsible RM: ${rmName}\nCompany: ${company.name}\nExposure: ${fmtMoneyFull(entry.value)}`,
        link: merchantLink,
      })
    );
    pushNotification(state, {
      to: entry.enteredBy || entry.rmId,
      subject: `[HoP Approved] Done Deal: ${entry.prospect}`,
      body: `Head of Products has approved your Done Deal submission on ${entry.prospect}.\n\nThe merchant has been added to the Master Ledger with code ${newCode}.`,
      link: merchantLink,
    });
    notifyRecipients(
      state,
      entry,
      `[Merchant Onboarded] ${entry.prospect} — ${newCode}`,
      `${entry.prospect} has been approved by the Head of Products and added to the Master Ledger as an active merchant.\nCode: ${newCode}\nResponsible: ${rmName} · ${company.name}\nExposure: ${fmtMoneyFull(entry.value)}`
    );
    notifyAdmin(
      state,
      `Done Deal approved: ${entry.prospect} (${newCode})`,
      `${hop.name} (Head of Products) approved the Done Deal for "${entry.prospect}"; merchant ${newCode} created in the Master Ledger.`,
      merchantLink
    );

    dialogs.alert(`Approved. ${newCode} created. RM, leadership and admin notified.`);
    return { navigate: routes.clientDetail(merchant.id) };
  });
}

/** Rejects an extension (closes the entry) or a Done Deal (back to Negotiation). */
export function rejectSubmission(store, entryId, kind) {
  const reason = dialogs.prompt('Reason for rejection:');
  if (!reason) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const hop = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);
    const label = kind === 'extend' ? 'extension' : 'Done Deal';

    if (kind === 'extend') {
      entry.status = 'Closed - Lost';
      entry.lostReason = `HoP rejected extension: ${reason}`;
    } else {
      entry.status = 'Negotiation';
      entry.doneDetails = null;
    }
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: entry.enteredBy || entry.rmId,
      subject: `[HoP Rejected] ${entry.prospect}`,
      body: `Head of Products has rejected your ${label} request on ${entry.prospect}.\n\nReason:\n"${reason}"\n\n${kind === 'extend' ? 'The entry has been closed.' : 'The entry has been returned to Negotiation status.'}`,
      link,
    });
    notifyRecipients(
      state,
      entry,
      `[Status Update] ${entry.prospect} — ${entry.status}`,
      `${hop.name} (Head of Products) rejected the ${label} for ${entry.prospect}. Status is now "${entry.status}".\nReason: "${reason}"`
    );
    notifyAdmin(
      state,
      `${kind === 'extend' ? 'Extension' : 'Done Deal'} rejected: ${entry.prospect}`,
      `${hop.name} (Head of Products) rejected the ${label} for "${entry.prospect}" → ${entry.status}.`,
      link
    );

    dialogs.alert('Rejected. RM and leadership have been notified.');
    return NO_NAV;
  });
}

/* ----------------------------------------------------------------- late entry */

export function approveLateEntry(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.lateEntry) return NO_NAV;
  if (
    !dialogs.confirm(
      `Approve this late entry for "${entry0.prospect}"?\n\nThe entry will become active in the pipeline as "First Meeting".`
    )
  ) {
    return NO_NAV;
  }

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const hop = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    entry.status = 'First Meeting';
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: entry.lateEntry.requestedBy,
      subject: `[HoP Approved] Late entry: ${entry.prospect}`,
      body: `Head of Products has approved your late entry for ${entry.prospect}.\n\nThe entry is now active in the pipeline.\n\nA reminder: future entries should be created BEFORE the visit, not after.`,
      link,
    });
    notifyRecipients(
      state,
      entry,
      `[Validated] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${hop.name} (Head of Products) approved the late entry for ${entry.prospect}. It is now active (First Meeting).\nResponsible: ${selectUser(state, entry.rmId).name}`
    );
    notifyAdmin(
      state,
      `Late entry approved: ${entry.prospect}`,
      `${hop.name} (Head of Products) approved the late entry for "${entry.prospect}" (First Meeting).`,
      link
    );

    dialogs.alert('Approved. Entrant and leadership notified. Entry is now active.');
    return NO_NAV;
  });
}

export function rejectLateEntry(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.lateEntry) return NO_NAV;
  const reason = dialogs.prompt('Reason for rejecting this late entry:');
  if (!reason) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const requesterId = entry.lateEntry.requestedBy;
    const prospect = entry.prospect;

    state.pipeline = state.pipeline.filter((x) => x.id !== entryId);

    pushNotification(state, {
      to: requesterId,
      subject: `[HoP Rejected] Late entry discarded: ${prospect}`,
      body: `Head of Products has rejected the late entry for ${prospect}.\n\nReason: "${reason}"\n\nThe entry has been discarded. Pipeline entries must be created before the visit.`,
    });

    dialogs.alert('Rejected. Entry discarded. Entrant notified.');
    return { navigate: routes.pipeline() };
  });
}

/* ----------------------------------------------------------------- edit gate */

export function approveEdit(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.pendingEdit) return NO_NAV;
  if (!dialogs.confirm('Apply the proposed edits?')) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const hop = selectMe(state);
    const requesterId = entry.pendingEdit.requestedBy;
    const link = legacyLink('pipeline-detail', entryId);

    Object.entries(entry.pendingEdit.changes).forEach(([key, value]) => {
      entry[key] = value;
    });
    entry.status = entry.priorStatus || 'Negotiation';
    delete entry.pendingEdit;
    delete entry.priorStatus;
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: requesterId,
      subject: `[HoP Approved] Edits applied: ${entry.prospect}`,
      body: `Head of Products has approved your edits on ${entry.prospect}. The changes are now live.`,
      link,
    });
    notifyRecipients(
      state,
      entry,
      `[Entry Updated] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${hop.name} (Head of Products) approved edits to ${entry.prospect}; the changes are now live. Status: ${entry.status}.`
    );
    notifyAdmin(state, `Edits approved: ${entry.prospect}`, `${hop.name} (Head of Products) approved edits to "${entry.prospect}".`, link);

    dialogs.alert('Edits applied. Requester and leadership notified.');
    return NO_NAV;
  });
}

export function rejectEdit(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.pendingEdit) return NO_NAV;
  const reason = dialogs.prompt('Reason for rejecting these edits:');
  if (!reason) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const requesterId = entry.pendingEdit.requestedBy;

    entry.status = entry.priorStatus || 'Negotiation';
    delete entry.pendingEdit;
    delete entry.priorStatus;
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: requesterId,
      subject: `[HoP Rejected] Edits not applied: ${entry.prospect}`,
      body: `Head of Products has rejected your edit request on ${entry.prospect}.\n\nReason:\n"${reason}"`,
      link: legacyLink('pipeline-detail', entryId),
    });

    dialogs.alert('Edits rejected. Requester notified.');
    return NO_NAV;
  });
}

/* --------------------------------------------------------------- delete gate */

export function approveDelete(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.pendingDelete) return NO_NAV;
  if (!dialogs.confirm(`Permanently delete "${entry0.prospect}"? This action cannot be undone.`)) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const hop = selectMe(state);
    const requesterId = entry.pendingDelete.requestedBy;
    const prospectName = entry.prospect;
    const coCode = selectCompany(state, entry.companyId).code;

    state.pipeline = state.pipeline.filter((x) => x.id !== entryId);

    pushNotification(state, {
      to: requesterId,
      subject: `[HoP Approved] Pipeline entry deleted: ${prospectName}`,
      body: `Head of Products has approved your deletion request. The entry for ${prospectName} has been permanently removed.`,
    });
    state.recipients.forEach((r) =>
      pushNotification(state, {
        to: r.id,
        subject: `[Entry Deleted] ${prospectName} — ${coCode}`,
        body: `${hop.name} (Head of Products) approved deletion of the pipeline entry for ${prospectName}. It has been permanently removed.`,
      })
    );
    notifyAdmin(state, `Entry deleted: ${prospectName}`, `${hop.name} (Head of Products) approved deletion of "${prospectName}".`);

    dialogs.alert('Entry deleted. Requester and leadership notified.');
    return { navigate: routes.pipeline() };
  });
}

export function rejectDelete(store, entryId) {
  const entry0 = selectPipelineEntry(store.getState(), entryId);
  if (!entry0?.pendingDelete) return NO_NAV;
  const reason = dialogs.prompt('Reason for rejecting the deletion:');
  if (!reason) return NO_NAV;

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    const requesterId = entry.pendingDelete.requestedBy;

    entry.status = entry.priorStatus || 'Negotiation';
    delete entry.pendingDelete;
    delete entry.priorStatus;
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: requesterId,
      subject: `[HoP Rejected] Deletion not approved: ${entry.prospect}`,
      body: `Head of Products has rejected your deletion request on ${entry.prospect}.\n\nReason:\n"${reason}"\n\nThe entry is still active.`,
      link: legacyLink('pipeline-detail', entryId),
    });

    dialogs.alert('Deletion rejected. Requester notified.');
    return NO_NAV;
  });
}
