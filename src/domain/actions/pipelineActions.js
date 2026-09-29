import { HOP_USER_ID, RELEASE_NOTIFY_IDS, ROLES } from '@/constants/roles';
import { dialogs } from '@/utils/dialogs';
import { fmtMoneyFull } from '@/utils/format';
import { todayLabel } from '@/utils/dates';
import { legacyLink, routes } from '@/utils/links';
import {
  addCommentToEntry,
  leadershipAudienceIds,
  notifyAdmin,
  notifyRecipients,
  pushNotification,
} from '../notifications';
import { nextPipelineCode, pipeProductLines } from '../pipelineRules';
import { productNames, selectCompany, selectMe, selectPipelineEntry, selectProduct, selectUser } from '../selectors';

/**
 * Pipeline actions — everything an RM or entrant can do to an entry.
 *
 * Each action mutates through `store.mutate(...)` and returns `{ navigate }` when
 * the caller should move to another route, mirroring the original's `go(...)` calls.
 */

const NO_NAV = {};

/* ------------------------------------------------------------------ creation */

/**
 * Creates a pipeline entry from the New Entry form.
 * `form` is already validated by the form component; this applies the routing
 * rules (directory vs manual name, cross-sell, late entry) and the fan-out.
 */
export function createPipelineEntry(store, form) {
  return store.mutate((state) => {
    const user = selectMe(state);
    const { reengageCtx } = state.session;
    const today = todayLabel();

    // A cross-sell keeps the existing merchant's identity: same company code + same
    // merchant reference. A normal entry gets its own company + new pipeline code.
    const crossSell = form.crossSell || null;
    const effectiveCoId = crossSell?.existingCompanyId || form.companyId;
    const pipeCode = crossSell ? crossSell.existingCode : nextPipelineCode(state, effectiveCoId);

    // Directory-selected & HoP-created entries are active immediately (no HoP validation).
    // Only manually-typed ("Not included") names still need HoP validation; late entries
    // still need approval. A cross-sell always routes to HoP (unless the HoP enters it).
    const hopCreated = user.role === ROLES.HEAD_OF_PRODUCTS;
    let status = form.isLate
      ? 'Pending HoP — Late Entry'
      : hopCreated || !form.notIncluded
        ? 'First Meeting'
        : 'Pending HoP — Validation';
    if (crossSell && !hopCreated) status = 'Pending HoP — Cross-sell';

    const activeComment = hopCreated
      ? crossSell
        ? 'Auto-validated cross-sell — created by the Head of Products.'
        : 'Auto-validated on entry — created by the Head of Products.'
      : 'Auto-active — prospect selected from the verified directory (no HoP validation required).';

    const entry = {
      id: 'pl_' + Date.now(),
      code: pipeCode,
      prospect: form.name,
      inList: !form.notIncluded,
      industry: form.industry,
      productsOfInterest: form.products,
      value: Number.isNaN(form.value) ? 0 : form.value,
      summary: form.summary,
      expectedClose: form.expectedClose,
      visitDate: form.visitDate,
      companySize: form.companySize,
      governorate: form.governorate,
      commercialRegister: form.commercialRegister,
      contactPerson: form.contactPerson,
      contactTitle: form.contactTitle,
      contactMobile: form.contactMobile,
      contactEmail: form.contactEmail,
      amlStatus: form.amlStatus,
      attendees: form.attendees.slice(),
      rmId: form.rmId,
      enteredBy: user.id,
      companyId: effectiveCoId,
      status,
      // Product-level tracking: each product of interest starts in Negotiation.
      productLines: form.products.map((productId) => ({
        productId,
        addedBy: user.id,
        addedByRole: user.role,
        subStatus: 'Negotiation',
        main: true,
      })),
      comments:
        status === 'First Meeting'
          ? [{ by: user.id, role: user.role, text: activeComment, type: 'approve', at: today }]
          : [],
      lastUpdate: today,
      createdAt: today,
    };

    if (reengageCtx) entry.reengagedFrom = reengageCtx.originalId || null;
    if (crossSell) entry.crossSell = crossSell;
    if (form.isLate) {
      entry.lateEntry = {
        closureDate: form.late.closure,
        reason: form.late.reason,
        minutes: form.late.minutes,
        callReport: form.late.fileName,
        requestedAt: today,
        requestedBy: user.id,
      };
      entry.meetingOutcome = {
        closureDate: form.late.closure,
        minutes: form.late.minutes,
        callReport: form.late.fileName,
        recordedAt: today,
      };
    }

    state.pipeline.unshift(entry);

    const link = legacyLink('pipeline-detail', entry.id);
    const responsibleRm = selectUser(state, form.rmId);
    const prodNames = productNames(state, form.products);
    const coCode = selectCompany(state, effectiveCoId)?.code;
    const needsHop = ['Pending HoP — Validation', 'Pending HoP — Late Entry', 'Pending HoP — Cross-sell'].includes(status);

    const statusLine =
      status === 'First Meeting'
        ? hopCreated
          ? 'Created and validated by the Head of Products — now active (First Meeting).'
          : 'Active (First Meeting) — selected from the verified directory, no HoP validation needed.'
        : status === 'Pending HoP — Late Entry'
          ? 'A LATE entry — pending Head of Products approval.'
          : status === 'Pending HoP — Cross-sell'
            ? `A CROSS-SELL against existing merchant ${crossSell ? crossSell.existingCode : ''} — pending Head of Products validation of a different department + product.`
            : 'Pending Head of Products validation (name typed manually / not in directory).';

    // 1) HoP action needed (manually-typed, late, or cross-sell entries)
    if (needsHop) {
      const hopTag =
        status === 'Pending HoP — Late Entry'
          ? 'Late Entry'
          : status === 'Pending HoP — Cross-sell'
            ? 'Cross-sell Validation'
            : 'Validation Required';
      const hopAsk =
        status === 'Pending HoP — Late Entry'
          ? 'approval (late entry — created after the visit)'
          : status === 'Pending HoP — Cross-sell'
            ? `validation that this is a DIFFERENT department and a DIFFERENT product than already sold to existing merchant ${crossSell ? crossSell.existingCode : ''} (already sold: ${productNames(state, crossSell ? crossSell.existingProducts : [])})`
            : 'validation (name typed manually — please verify it exists)';
      pushNotification(state, {
        to: HOP_USER_ID,
        subject: `[${hopTag}] ${form.name} — ${coCode}`,
        body: `A new pipeline entry needs your ${hopAsk}.\n\nProspect: ${form.name}\nIndustry: ${form.industry}\nProducts now proposed: ${prodNames}\nEstimated Value: ${fmtMoneyFull(form.value)}\nResponsible: ${responsibleRm.name}\nEntered by: ${user.name} (${user.role})\nContact: ${form.contactPerson || '—'} (${form.contactTitle || '—'}) · ${form.contactMobile || '—'} · ${form.contactEmail || '—'}`,
        link,
      });
    }

    // 2) Notify the entire leadership audience — CEO + MD + every directory level
    const audience = leadershipAudienceIds(state, user.id);
    const prospectBody = `A new prospect has been entered into the pipeline.\n\nProspect: ${form.name}\nIndustry: ${form.industry}\nProducts of interest: ${prodNames}\nEstimated Value: ${fmtMoneyFull(form.value)}\nResponsible: ${responsibleRm.name}\nEntered by: ${user.name}\n\n${statusLine}\n\nOpen the entry to review it or flag "I'm interested".`;
    audience.forEach((to) =>
      pushNotification(state, { to, subject: `[New Prospect] ${form.name} — ${form.industry}`, body: prospectBody, link })
    );

    // 3) Notify the assigned RM if created on their behalf
    if (user.id !== form.rmId) {
      pushNotification(state, {
        to: form.rmId,
        subject: `[New Pipeline Assigned] ${form.name} assigned to you`,
        body: `${user.name} (${user.role}) created a new pipeline entry and assigned it to you.\n\nProspect: ${form.name}\nIndustry: ${form.industry}\nValue: ${fmtMoneyFull(form.value)}\n\n${statusLine}`,
        link,
      });
    }

    notifyAdmin(
      state,
      `New prospect: ${form.name}`,
      `A new pipeline entry was created.\n\nProspect: ${form.name}\nStatus: ${status}\nIndustry: ${form.industry}\nProducts: ${prodNames}\nValue: ${fmtMoneyFull(form.value)}\nCompany: ${selectCompany(state, effectiveCoId)?.name}${crossSell ? ' (cross-sell — same reference ' + crossSell.existingCode + ' as existing merchant)' : ''}\nAML: ${form.amlStatus}\nIn directory: ${form.notIncluded ? 'No (typed manually)' : 'Yes'}`,
      link
    );

    state.session.reengageCtx = null;
    state.session.crossSellCtx = null;
    state.session.justCreatedPipeline = entry.id;

    return {
      entryId: entry.id,
      statusLine,
      audienceCount: audience.length,
      navigate: routes.catalogue(),
    };
  });
}

/* --------------------------------------------------------------- stage moves */

/** Applies a stage that needs no approval, and notifies leadership. */
export function applyStageChange(store, entryId, newStage) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry || newStage === entry.status) return NO_NAV;
    const user = selectMe(state);
    const oldStage = entry.status;

    entry.status = newStage;
    entry.lastUpdate = todayLabel();

    notifyRecipients(
      state,
      entry,
      `[Status Update] ${entry.prospect} — ${newStage}`,
      `The status of ${entry.prospect} was updated by ${user.name}.\nFrom: ${oldStage}\nTo: ${newStage}\nIndustry: ${entry.industry}\nResponsible: ${selectUser(state, entry.rmId).name} · ${selectCompany(state, entry.companyId).name}`
    );
    notifyAdmin(
      state,
      `Status changed: ${entry.prospect} → ${newStage}`,
      `${user.name} moved "${entry.prospect}" from ${oldStage} to ${newStage}.`,
      legacyLink('pipeline-detail', entryId)
    );

    dialogs.alert(`Status updated to "${newStage}". Leadership has been notified.`);
    return NO_NAV;
  });
}

/** Submits an Extend Negotiation request for HoP approval. */
export function submitExtendRequest(store, entryId, { details, fileName }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const entrant = selectUser(state, entry.enteredBy || entry.rmId);
    const link = legacyLink('pipeline-detail', entryId);

    entry.status = 'Pending HoP — Extend';
    entry.extendDetails = details;
    entry.uploadedDoc = fileName;
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Action Required] Extend Negotiation — ${entry.prospect}`,
      body: `${entrant.name} has requested an extension on ${entry.prospect}.\n\nReason:\n"${details}"\n\nSupporting document: ${fileName || 'None attached'}\n\nPlease review and approve or reject.`,
      link,
    });
    notifyRecipients(
      state,
      entry,
      `[Extension Requested] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${entrant.name} submitted an extension request for ${entry.prospect} (pending Head of Products approval).\nReason: "${details}"`
    );
    notifyAdmin(state, `Extension request: ${entry.prospect}`, `An extension request was submitted on ${entry.prospect}.\n\nReason: "${details}"`, link);

    dialogs.alert('Submitted for Head of Products approval. Leadership notified. Entry locked until decision.');
    return NO_NAV;
  });
}

/** Submits a Done Deal for HoP validation. */
export function submitDoneDeal(store, entryId, { details, fileName }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const entrant = selectUser(state, entry.enteredBy || entry.rmId);
    const link = legacyLink('pipeline-detail', entryId);

    entry.status = 'Pending HoP — Done Deal';
    entry.doneDetails = details;
    entry.uploadedDoc = fileName;
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Action Required] Done Deal validation — ${entry.prospect}`,
      body: `${entrant.name} has marked ${entry.prospect} as Done Deal.\n\nSold products / final terms:\n"${details}"\n\nSigned contract: ${fileName}\n\nPlease validate and approve to add to the Master Ledger.`,
      link,
    });
    notifyRecipients(
      state,
      entry,
      `[Done Deal Submitted] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${entrant.name} submitted a Done Deal for ${entry.prospect} (pending Head of Products validation).\nSold products / terms: "${details}"`
    );
    notifyAdmin(
      state,
      `Done Deal submitted: ${entry.prospect}`,
      `A Done Deal was submitted for ${entry.prospect}.\n\nSold products / terms: "${details}"\nSigned contract: ${fileName}`,
      link
    );

    dialogs.alert(
      'Submitted for Head of Products approval. Leadership notified. After approval the deal will be added to the Master Ledger automatically.'
    );
    return NO_NAV;
  });
}

/* ------------------------------------------------------------ meeting outcome */

export function saveMeetingOutcome(store, entryId, { closureDate, minutes, fileName }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const user = selectMe(state);

    entry.meetingOutcome = {
      closureDate,
      minutes,
      callReport: fileName,
      recordedAt: todayLabel(),
      recordedBy: user.id,
    };
    entry.lastUpdate = todayLabel();

    notifyRecipients(
      state,
      entry,
      `[Meeting Outcome] ${entry.prospect} — ${selectCompany(state, entry.companyId).code}`,
      `${user.name} recorded the meeting outcome for ${entry.prospect}.\nClosure date: ${closureDate}${minutes ? '\nMinutes: "' + minutes + '"' : ''}${fileName ? '\nCall report: ' + fileName : ''}`
    );
    notifyAdmin(
      state,
      `Meeting outcome recorded: ${entry.prospect}`,
      `${user.name} recorded a meeting outcome for "${entry.prospect}" (closure ${closureDate}).`,
      legacyLink('pipeline-detail', entryId)
    );

    dialogs.alert('Meeting outcome recorded. Leadership notified. The entry has been refreshed.');
    return NO_NAV;
  });
}

/* ------------------------------------------------------------- edit / delete */

/** Submits an edit for HoP approval. Returns false when nothing actually changed. */
export function submitEditRequest(store, entryId, { values, reason }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return { applied: false };
    const user = selectMe(state);

    // Build a diff (only changed fields)
    const changes = {};
    const previous = {};
    Object.keys(values).forEach((key) => {
      if (String(entry[key]) !== String(values[key])) {
        changes[key] = values[key];
        previous[key] = entry[key];
      }
    });
    if (Object.keys(changes).length === 0) return { applied: false };

    entry.priorStatus = entry.status; // remember status to restore after approval/rejection
    entry.pendingEdit = { changes, previous, reason, requestedAt: todayLabel(), requestedBy: user.id };
    entry.status = 'Pending HoP — Edit';
    entry.lastUpdate = todayLabel();

    const link = legacyLink('pipeline-detail', entryId);
    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Edit Approval Needed] ${entry.prospect}`,
      body: `${user.name} has requested edits to pipeline entry ${entry.prospect}.\n\nReason:\n"${reason}"\n\nFields changed: ${Object.keys(changes).join(', ')}\n\nPlease review and approve or reject in the platform.`,
      link,
    });
    notifyAdmin(
      state,
      `Edit request: ${entry.prospect}`,
      `An edit request was submitted on ${entry.prospect}.\n\nReason: "${reason}"\nFields changed: ${Object.keys(changes).join(', ')}`,
      link
    );

    dialogs.alert('Edit submitted for Head of Products approval. The entry is now locked.');
    return { applied: true };
  });
}

export function requestDelete(store, entryId) {
  const entryName = selectPipelineEntry(store.getState(), entryId)?.prospect;
  const reason = dialogs.prompt(
    `Request deletion of "${entryName}"?\n\nReason for deletion (will be sent to Head of Products):`
  );
  if (!reason || reason.trim().length < 10) {
    if (reason !== null) dialogs.alert('A reason of at least 10 characters is required.');
    return NO_NAV;
  }

  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const user = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    entry.priorStatus = entry.status;
    entry.pendingDelete = { reason: reason.trim(), requestedAt: todayLabel(), requestedBy: user.id };
    entry.status = 'Pending HoP — Delete';
    entry.lastUpdate = todayLabel();

    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Delete Approval Needed] ${entry.prospect}`,
      body: `${user.name} has requested deletion of pipeline entry ${entry.prospect}.\n\nReason:\n"${reason}"\n\nApprove or reject in the platform.`,
      link,
    });
    notifyAdmin(state, `Delete request: ${entry.prospect}`, `A deletion request was submitted for ${entry.prospect}.\n\nReason: "${reason.trim()}"`, link);

    dialogs.alert('Delete request submitted for Head of Products approval. The entry is locked until decision.');
    return NO_NAV;
  });
}

export function resubmitValidation(store, entryId) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    const user = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    entry.status = 'Pending HoP — Validation';
    entry.lastUpdate = todayLabel();
    addCommentToEntry(state, entry, 'Resubmitted for validation.', 'note');

    pushNotification(state, {
      to: HOP_USER_ID,
      subject: `[Validation Required] ${entry.prospect} resubmitted`,
      body: `${user.name} resubmitted "${entry.prospect}" for validation.`,
      link,
    });
    notifyAdmin(state, `Entry resubmitted: ${entry.prospect}`, `${user.name} resubmitted "${entry.prospect}" for Head of Products validation.`, link);

    dialogs.alert('Resubmitted to Head of Products for validation.');
    return NO_NAV;
  });
}

export function addComment(store, entryId, text) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    addCommentToEntry(state, entry, text, 'note');
    entry.lastUpdate = todayLabel();
    return NO_NAV;
  });
}

/* -------------------------------------------------------------- attachments */

export function addAttachment(store, entryId, { fileName, note }) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    if (!entry.attachments) entry.attachments = [];
    entry.attachments.push({
      id: 'att_' + Date.now(),
      fileName,
      note: (note || '').trim(),
      uploadedBy: selectMe(state).id,
      uploadedAt: todayLabel(),
    });
    entry.lastUpdate = todayLabel();
    dialogs.alert(`"${fileName}" attached.`);
    return NO_NAV;
  });
}

export function removeAttachment(store, entryId, attachmentId) {
  const entry = selectPipelineEntry(store.getState(), entryId);
  const attachment = entry?.attachments?.find((a) => a.id === attachmentId);
  if (!attachment) return NO_NAV;
  if (!dialogs.confirm(`Remove attachment "${attachment.fileName}"?`)) return NO_NAV;

  return store.mutate((state) => {
    const target = selectPipelineEntry(state, entryId);
    target.attachments = target.attachments.filter((a) => a.id !== attachmentId);
    target.lastUpdate = todayLabel();
    return NO_NAV;
  });
}

/* ----------------------------------------------------- product-level tracking */

export function setProductSubStatus(store, entryId, productId, subStatus) {
  return store.mutate((state) => {
    const entry = selectPipelineEntry(state, entryId);
    if (!entry) return NO_NAV;
    if (!Array.isArray(entry.productLines) || !entry.productLines.length) {
      entry.productLines = pipeProductLines(entry).map((line) => ({ ...line }));
    }
    const line = entry.productLines.find((l) => l.productId === productId);
    if (line) line.subStatus = subStatus;
    entry.lastUpdate = todayLabel();

    notifyAdmin(
      state,
      `Product stage update: ${entry.prospect}`,
      `${selectMe(state).name} set "${selectProduct(state, productId)?.name || productId}" to "${subStatus}" on ${entry.prospect} (${entry.code}).`,
      legacyLink('pipeline-detail', entryId)
    );
    return NO_NAV;
  });
}

/* ------------------------------------------------------------- good to go */

export function movePipelineToGoodToGo(store, entryId) {
  const entry = selectPipelineEntry(store.getState(), entryId);
  if (!entry) return NO_NAV;
  if (
    !dialogs.confirm(
      `Move "${entry.prospect}" to the Good to Go list?\n\n• It will be visible to all RMs group-wide for re-engagement\n• MD and CEO will be notified by email`
    )
  ) {
    return NO_NAV;
  }

  return store.mutate((state) => {
    const target = selectPipelineEntry(state, entryId);
    const user = selectMe(state);
    const link = legacyLink('pipeline-detail', entryId);

    target.status = 'Good to Go';
    target.lastUpdate = todayLabel();

    const rm = selectUser(state, target.rmId);
    RELEASE_NOTIFY_IDS.forEach((to) =>
      pushNotification(state, {
        to,
        subject: `[Good to Go] Pipeline entry moved: ${target.prospect}`,
        body: `A pipeline entry has been moved to the Good to Go list and is now available group-wide for re-engagement.\n\nProspect: ${target.prospect}\nIndustry: ${target.industry}\nResponsible RM: ${rm.name} (${rm.email})\nCompany: ${selectCompany(state, target.companyId).name}\nPipeline value: ${fmtMoneyFull(target.value)}`,
        link,
      })
    );
    if (user.id !== target.rmId) {
      pushNotification(state, {
        to: target.rmId,
        subject: `[Good to Go] Your pipeline entry was moved: ${target.prospect}`,
        body: `Your pipeline entry for ${target.prospect} has been moved to the Good to Go list by ${user.name} (${user.role}).`,
        link,
      });
    }

    dialogs.alert('Moved to Good to Go. MD, CEO, and HoP have been notified.');
    return NO_NAV;
  });
}

/**
 * Re-engage a Good-to-Go item — works for BOTH a pipeline entry and a merchant.
 * Captures the prospect's history, then opens the standard new-prospect form with
 * the company + name fixed.
 */
export function startReengagement(store, recordId) {
  return store.mutate((state) => {
    const user = selectMe(state);
    const entry = selectPipelineEntry(state, recordId);
    const merchant = entry ? null : state.clients.find((c) => c.id === recordId);
    const source = entry || merchant;
    if (!source) return NO_NAV;

    const name = entry ? entry.prospect : merchant.name;
    const priorMerchant =
      merchant || state.clients.find((c) => (c.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());

    state.session.reengageCtx = {
      originalId: source.id,
      name,
      // RMs re-engage under their own company (drives the new reference code);
      // others keep the origin.
      companyId: user.role === ROLES.RM ? user.companyId : source.companyId,
      history: {
        industry: source.industry || '—',
        value: entry ? entry.value || 0 : merchant.exposure || 0,
        summary: entry
          ? entry.summary || ''
          : `Previously an onboarded merchant (${merchant.code || '—'}), later released to the Good to Go list.`,
        products: (entry ? entry.productsOfInterest || [] : merchant.productsSold || [])
          .map((pid) => selectProduct(state, pid)?.name)
          .filter(Boolean),
        originalCode: source.code || '',
        originalRm: selectUser(state, source.rmId)?.name || '—',
        originalCompany: selectCompany(state, source.companyId)?.code || '—',
        createdAt: (entry && entry.createdAt) || '—',
        lastUpdate: source.lastUpdate || '—',
        comments: entry?.comments ? entry.comments.slice() : [],
        priorMerchantCode: priorMerchant ? priorMerchant.code : '',
        priorExposure: priorMerchant ? priorMerchant.exposure : null,
      },
    };

    return { navigate: routes.pipelineNew() };
  });
}

/** Clears any lingering re-engagement / cross-sell context before a clean entry. */
export function startNewEntry(store) {
  return store.mutate((state) => {
    state.session.reengageCtx = null;
    state.session.crossSellCtx = null;
    return { navigate: routes.pipelineNew() };
  });
}

/* ------------------------------------------------------------ draft handover */

/** Stores a draft to resume in the New Entry form, then navigates there. */
export function resumeDraft(store, draft) {
  return store.mutate((state) => {
    state.session.draftResume = draft;
    state.session.editingDraftId = draft.id;
    state.session.reengageCtx = draft.reengage || null;
    return { navigate: routes.pipelineNew() };
  });
}

/** Clears the "just created" banner flag once the catalogue has shown it. */
export function consumeJustCreated(store) {
  return store.mutate((state) => {
    const id = state.session.justCreatedPipeline;
    state.session.justCreatedPipeline = null;
    return { id };
  });
}

/** Clears a resumed draft once the form has applied it. */
export function consumeDraftResume(store) {
  return store.mutate((state) => {
    const draft = state.session.draftResume;
    state.session.draftResume = null;
    return { draft };
  });
}

/** Forgets the draft being edited (after submit or explicit save). */
export function clearEditingDraft(store) {
  return store.mutate((state) => {
    state.session.editingDraftId = null;
    return NO_NAV;
  });
}
