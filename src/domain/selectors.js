/** Read-only lookups over the store state. Direct ports of the original helpers. */

export const selectMe = (state) =>
  state.users.find((u) => u.id === state.me?.id) || state.me || null;

export const selectUser = (state, id) => state.users.find((u) => u.id === id);
export const selectCompany = (state, id) => state.companies.find((c) => c.id === id);
export const selectProduct = (state, id) => state.products.find((p) => p.id === id);
export const selectBundle = (state, id) => state.bundles.find((b) => b.id === id);
export const selectClient = (state, id) => state.clients.find((c) => c.id === id);
export const selectPipelineEntry = (state, id) => state.pipeline.find((p) => p.id === id);

/** Name of a user / company / product, or an em dash. */
export const userName = (state, id) => selectUser(state, id)?.name || '—';
export const companyCode = (state, id) => selectCompany(state, id)?.code || '—';
export const productName = (state, id) => selectProduct(state, id)?.name || '';

/** Comma-joined product names for a list of ids, or an em dash. */
export function productNames(state, ids) {
  return (
    (ids || [])
      .map((id) => selectProduct(state, id)?.name)
      .filter(Boolean)
      .join(', ') || '—'
  );
}

export const selectUnreadCount = (state, userId) =>
  state.notifications.filter((n) => n.to === userId && !n.read).length;

export const selectMyNotifications = (state, userId) =>
  state.notifications.filter((n) => n.to === userId);

/** Pipeline entries where someone other than `userId` has flagged interest. */
export const selectInterestReceived = (state, userId) =>
  state.pipeline.filter(
    (p) =>
      (p.enteredBy === userId || p.rmId === userId) &&
      p.interestedFlags &&
      p.interestedFlags.some((f) => f.userId !== userId)
  );

/** Pipeline entries `userId` has flagged as interesting. */
export const selectInterestSent = (state, userId) =>
  state.pipeline.filter((p) => p.interestedFlags?.some((f) => f.userId === userId));

export const selectOpenReferrals = (state, user) =>
  (state.referrals || []).filter(
    (r) => r.status === 'Open' && (r.toLeaderId === user.id || user.role === 'Admin')
  );

/** Team members a leader can delegate a lead to. */
export const selectDelegatableUsers = (state) =>
  state.users.filter((u) => u.role === 'RM' || u.role === 'Employee');

/** C-level style accounts a department lead can be directed to. */
export const selectLeaderUsers = (state) =>
  state.users.filter(
    (u) => u.role === 'CEO' || u.role === 'MD' || u.group === 'C-Level' || u.group === 'MD'
  );
